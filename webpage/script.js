const outputDiv = document.getElementById('output');
const fetchBtn = document.getElementById('fetchBtn');
const setCredentialsBtn = document.getElementById('setCredentialsBtn');
const credentialsModal = document.getElementById('credentialsModal');
const orgInput = document.getElementById('orgInput');
const keyInput = document.getElementById('keyInput');
const submitCredentials = document.getElementById('submitCredentials');
const cancelCredentials = document.getElementById('cancelCredentials');
const activeUsersChartCanvas = document.getElementById('activeUsersChart');
const topLanguagesChartCanvas = document.getElementById('topLanguagesChart');
let activeUsersChartInstance = null; // To hold chart instance for updates
let topLanguagesChartInstance = null;

function showCredentialsModal() {
  credentialsModal.style.display = 'block';
  // Reset inputs if needed; org has default
  keyInput.value = '';  // Clear key input for security
}

function hideCredentialsModal() {
  credentialsModal.style.display = 'none';
}

submitCredentials.addEventListener('click', () => {
  const org = orgInput.value.trim();
  const apiKey = keyInput.value.trim();
  if (!org) {
    outputDiv.textContent = 'Organization name required!';
    return;
  }
  if (!apiKey) {
    outputDiv.textContent = 'API key required!';
    return;
  }
  localStorage.setItem('githubOrgName', org);
  localStorage.setItem('githubApiKey', apiKey);
  hideCredentialsModal();
  fetchData();  // Auto-trigger fetch after setting
});

cancelCredentials.addEventListener('click', () => {
  hideCredentialsModal();
});

function getCredentialsOrFetchData() {
  const apiKey = localStorage.getItem('githubApiKey');
  const org = localStorage.getItem('githubOrgName');
  if (!apiKey || !org) {
    showCredentialsModal();
    return;
  }
  fetchData();
}

function fetchData() {
  const apiKey = localStorage.getItem('githubApiKey');
  const org = localStorage.getItem('githubOrgName');
  outputDiv.textContent = 'Loading...';

  fetch(`https://api.github.com/orgs/${org}/copilot/metrics`, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${apiKey}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.length === 0) {
        outputDiv.textContent = 'No data available.';
        return;
      }
      const dates = data.map(item => item.date);
      const activeUsers = data.map(item => item.total_active_users);
      const engagedUsers = data.map(item => item.total_engaged_users);

      // Process language rankings
      const languageSums = {};
      data.forEach(day => {
        if (day.copilot_ide_code_completions && day.copilot_ide_code_completions.languages) {
          day.copilot_ide_code_completions.languages.forEach(lang => {
            const name = lang.name;
            const engaged = lang.total_engaged_users || 0;
            if (!languageSums[name]) {
              languageSums[name] = 0;
            }
            languageSums[name] += engaged;
          });
        }
      });

      // Sort languages by sum descending and take top 20
      const sortedLanguages = Object.entries(languageSums)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

      const langLabels = sortedLanguages.map(([name]) => name);
      const langData = sortedLanguages.map(([, sum]) => sum);

      // Destroy existing bar chart if it exists
      if (topLanguagesChartInstance) {
        topLanguagesChartInstance.destroy();
      }

      // Create new bar chart
      topLanguagesChartInstance = new Chart(topLanguagesChartCanvas, {
        type: 'bar',
        data: {
          labels: langLabels,
          datasets: [{
            label: 'Engaged Users',
            data: langData,
            backgroundColor: '#007bff'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

      // Destroy existing line chart if it exists
      if (activeUsersChartInstance) {
        activeUsersChartInstance.destroy();
      }

      // Create new line chart
      activeUsersChartInstance = new Chart(activeUsersChartCanvas, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'Total Active Users',
            data: activeUsers,
            borderColor: '#007bff',
            tension: 0.1
          }, {
            label: 'Total Engaged Users',
            data: engagedUsers,
            borderColor: '#28a745',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

      outputDiv.textContent = 'Data fetched successfully.';
    })
    .catch(error => outputDiv.textContent = `Error: ${error.message}`);
}

setCredentialsBtn.addEventListener('click', showCredentialsModal);
fetchBtn.addEventListener('click', getCredentialsOrFetchData); 