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
const ideOverviewChartCanvas = document.getElementById('ideOverviewChart');
const ideChatChartCanvas = document.getElementById('ideChatChart');
const ideChartsContainer = document.getElementById('ideChartsContainer');
let activeUsersChartInstance = null; // To hold chart instance for updates
let topLanguagesChartInstance = null;
let ideOverviewChartInstance = null;
let ideChatChartInstance = null;
let ideChartInstances = {};
const modalError = document.getElementById('modalError');
const toggleSidebar = document.getElementById('toggleSidebar');
const sidebar = document.getElementById('sidebar');
const mainColumn = document.getElementById('mainColumn');

toggleSidebar.addEventListener('click', () => {
  document.body.classList.toggle('sidebar-collapsed');
});

function showCredentialsModal() {
  credentialsModal.style.display = 'block';
  // Reset inputs if needed; org has default
  keyInput.value = '';  // Clear key input for security
  modalError.textContent = '';
}

function hideCredentialsModal() {
  credentialsModal.style.display = 'none';
}

submitCredentials.addEventListener('click', () => {
  const org = orgInput.value.trim();
  const apiKey = keyInput.value.trim();
  if (!org) {
    modalError.textContent = 'Organization name required!';
    return;
  }
  if (!apiKey) {
    modalError.textContent = 'API key required!';
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

function processIdeData(data) {
  const ideOverview = {};
  const ideChat = {};
  const ideLanguageMatrix = {};

  data.forEach(day => {
    // Process IDE code completions for overview and language matrix
    if (day.copilot_ide_code_completions && day.copilot_ide_code_completions.editors) {
      day.copilot_ide_code_completions.editors.forEach(editor => {
        const ideName = editor.name;
        
        // IDE Overview - sum engaged users
        if (!ideOverview[ideName]) ideOverview[ideName] = 0;
        ideOverview[ideName] += editor.total_engaged_users || 0;

        // IDE Language Matrix
        if (!ideLanguageMatrix[ideName]) ideLanguageMatrix[ideName] = {};
        if (editor.models && editor.models[0] && editor.models[0].languages) {
          editor.models[0].languages.forEach(lang => {
            const langName = lang.name;
            if (!ideLanguageMatrix[ideName][langName]) ideLanguageMatrix[ideName][langName] = 0;
            ideLanguageMatrix[ideName][langName] += lang.total_engaged_users || 0;
          });
        }
      });
    }

    // Process IDE chat data
    if (day.copilot_ide_chat && day.copilot_ide_chat.editors) {
      day.copilot_ide_chat.editors.forEach(editor => {
        const ideName = editor.name;
        if (!ideChat[ideName]) ideChat[ideName] = { chats: 0, users: 0 };
        
        if (editor.models && editor.models[0]) {
          ideChat[ideName].chats += editor.models[0].total_chats || 0;
          ideChat[ideName].users += editor.models[0].total_engaged_users || 0;
        }
      });
    }
  });

  return { ideOverview, ideChat, ideLanguageMatrix };
}

function createIdeCharts(ideData) {
  // Destroy existing charts
  if (ideOverviewChartInstance) ideOverviewChartInstance.destroy();
  if (ideChatChartInstance) ideChatChartInstance.destroy();
  
  // Destroy existing IDE language charts
  Object.values(ideChartInstances).forEach(chart => chart.destroy());
  ideChartInstances = {};

  // IDE Overview - Donut Chart
  const overviewLabels = Object.keys(ideData.ideOverview);
  const overviewData = Object.values(ideData.ideOverview);
  const ideColors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1'];

  ideOverviewChartInstance = new Chart(ideOverviewChartCanvas, {
    type: 'bar',
    data: {
      labels: overviewLabels,
      datasets: [{
        label: 'Engaged Users',
        data: overviewData,
        backgroundColor: ideColors.slice(0, overviewLabels.length)
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

  // IDE Chat Activity - Bar Chart
  const chatLabels = Object.keys(ideData.ideChat);
  const userChatData = chatLabels.map(ide => ideData.ideChat[ide].users);

  ideChatChartInstance = new Chart(ideChatChartCanvas, {
    type: 'bar',
    data: {
      labels: chatLabels,
      datasets: [{
        label: 'Engaged Users',
        data: userChatData,
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

  // Create individual charts for each IDE with proper sorting
  createIndividualIdeCharts(ideData.ideLanguageMatrix);
}

function createIndividualIdeCharts(ideLanguageMatrix) {
  // Clear the container
  ideChartsContainer.innerHTML = '';
  
  const languageColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#FF9A8B', '#A8E6CF', '#FFD93D'
  ];
  
  // Create a chart for each IDE
  Object.keys(ideLanguageMatrix).forEach(ideId => {
    const ideData = ideLanguageMatrix[ideId];
    
    // Skip "unknown" IDE
    if (ideId.toLowerCase() === 'unknown') return;
    
    // Sort languages by usage for this specific IDE (descending order)
    const sortedLanguages = Object.entries(ideData)
      .filter(([lang, value]) => value > 0) // Only include languages with usage
      .sort(([,a], [,b]) => b - a) // Sort by value descending
      .slice(0, 8); // Top 8 languages
    
    if (sortedLanguages.length === 0) return; // Skip if no data
    
    // Create container div
    const chartContainer = document.createElement('div');
    chartContainer.className = 'ide-chart-container';
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = ideId;
    chartContainer.appendChild(title);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = `ideChart_${ideId}`;
    chartContainer.appendChild(canvas);
    
    // Add to container
    ideChartsContainer.appendChild(chartContainer);
    
    // Prepare data for chart - highest usage on the left
    const labels = sortedLanguages.map(([lang]) => lang);
    const data = sortedLanguages.map(([, value]) => value);
    const colors = labels.map((_, index) => languageColors[index % languageColors.length]);
    
    // Create chart
    const ctx = canvas.getContext('2d');
    ideChartInstances[ideId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Engaged Users',
          data: data,
          backgroundColor: colors
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false // Hide legend for cleaner look
          }
        },
        scales: {
          y: {
            beginAtZero: true
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              padding: 10
            },
            offset: true
          }
        }
      }
    });
  });
}

function fetchData() {
  const apiKey = localStorage.getItem('githubApiKey');
  const org = localStorage.getItem('githubOrgName');
  console.log('Fetching data...');

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
        console.log('No data available.');
        return;
      }

      // Process weekly aggregates
      const weeklyData = new Map();

      function getWeekStart(dateStr) {
        const date = new Date(dateStr);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        return new Date(date.setDate(diff)).toISOString().split('T')[0];
      }

      data.forEach(item => {
        const week = getWeekStart(item.date);
        if (!weeklyData.has(week)) {
          weeklyData.set(week, { active: 0, engaged: 0 });
        }
        weeklyData.get(week).active += item.total_active_users || 0;
        weeklyData.get(week).engaged += item.total_engaged_users || 0;
      });

      const sortedWeeks = Array.from(weeklyData.keys()).sort();
      const activeUsers = sortedWeeks.map(week => weeklyData.get(week).active);
      const engagedUsers = sortedWeeks.map(week => weeklyData.get(week).engaged);

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

      // Process IDE data
      const ideData = processIdeData(data);
      createIdeCharts(ideData);

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

      // Create new line chart with weekly data
      activeUsersChartInstance = new Chart(activeUsersChartCanvas, {
        type: 'line',
        data: {
          labels: sortedWeeks,
          datasets: [{
            label: 'Total Active Users',
            data: activeUsers,
            borderColor: '#87CEEB',
            backgroundColor: 'rgba(135, 206, 235, 0.1)',
            tension: 0.1
          }, {
            label: 'Total Engaged Users',
            data: engagedUsers,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            },
            x: {
              ticks: {
                autoSkip: true,
                maxRotation: 90,
                minRotation: 90
              }
            }
          }
        }
      });

      console.log('Data fetched successfully.');
    })
    .catch(error => console.error(`Error: ${error.message}`));
}

setCredentialsBtn.addEventListener('click', showCredentialsModal);
fetchBtn.addEventListener('click', getCredentialsOrFetchData); 