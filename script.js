// Global state
let resumeUploaded = false;
let currentSessionId = null;

// Initialize file upload handlers
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            uploadResume(e.target.files[0]);
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
            uploadResume(e.dataTransfer.files[0]);
        }
    });
    
    // Click to upload
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
});

// Upload resume
async function uploadResume(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.className = 'upload-status';
    statusDiv.textContent = 'Uploading...';
    statusDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            statusDiv.className = 'upload-status success';
            statusDiv.textContent = '✓ Resume uploaded successfully!';
            resumeUploaded = true;
            currentSessionId = data.session_id;
            
            // Automatically analyze resume
            analyzeResume();
        } else {
            statusDiv.className = 'upload-status error';
            statusDiv.textContent = '✗ ' + (data.error || 'Upload failed');
        }
    } catch (error) {
        statusDiv.className = 'upload-status error';
        statusDiv.textContent = '✗ Error: ' + error.message;
    }
}

// Analyze resume
async function analyzeResume() {
    if (!resumeUploaded) {
        alert('Please upload a resume first');
        return;
    }
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayAnalysis(data.analysis);
        } else {
            alert('Error analyzing resume: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Display analysis results
function displayAnalysis(analysis) {
    const section = document.getElementById('analysisSection');
    const resultsDiv = document.getElementById('analysisResults');
    
    section.style.display = 'block';
    
    let html = '';
    
    // Skills
    if (analysis.skills && analysis.skills.length > 0) {
        html += `
            <div class="analysis-item">
                <h3>Skills Found (${analysis.skills.length})</h3>
                <div class="skills-list">
                    ${analysis.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // Experience
    if (analysis.experience) {
        html += `
            <div class="analysis-item">
                <h3>Experience</h3>
                <div class="stat-item">
                    <span>Estimated Years:</span>
                    <strong>${analysis.experience.experience_years || 0} years</strong>
                </div>
                ${analysis.experience.companies_found && analysis.experience.companies_found.length > 0 ? `
                    <div style="margin-top: 10px;">
                        <strong>Companies:</strong> ${analysis.experience.companies_found.join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Education
    if (analysis.education) {
        html += `
            <div class="analysis-item">
                <h3>Education</h3>
                ${analysis.education.degrees && analysis.education.degrees.length > 0 ? `
                    <div><strong>Degrees:</strong> ${analysis.education.degrees.join(', ')}</div>
                ` : ''}
                ${analysis.education.institutions && analysis.education.institutions.length > 0 ? `
                    <div style="margin-top: 10px;"><strong>Institutions:</strong> ${analysis.education.institutions.join(', ')}</div>
                ` : ''}
            </div>
        `;
    }
    
    // Statistics
    if (analysis.statistics) {
        html += `
            <div class="analysis-item">
                <h3>Statistics</h3>
                <div class="stat-item">
                    <span>Word Count:</span>
                    <strong>${analysis.statistics.word_count || 0}</strong>
                </div>
                <div class="stat-item">
                    <span>Character Count:</span>
                    <strong>${analysis.statistics.char_count || 0}</strong>
                </div>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
}

// Match job description
async function matchJob() {
    if (!resumeUploaded) {
        alert('Please upload a resume first');
        return;
    }
    
    const jobDescription = document.getElementById('jobDescription').value.trim();
    
    if (!jobDescription) {
        alert('Please enter a job description');
        return;
    }
    
    const resultsDiv = document.getElementById('matchResults');
    resultsDiv.innerHTML = '<div class="loading"></div> Analyzing...';
    
    try {
        const response = await fetch('/api/match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ job_description: jobDescription })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayMatchResults(data.match);
        } else {
            resultsDiv.innerHTML = '<div class="upload-status error">Error: ' + (data.error || 'Unknown error') + '</div>';
        }
    } catch (error) {
        resultsDiv.innerHTML = '<div class="upload-status error">Error: ' + error.message + '</div>';
    }
}

// Display match results
function displayMatchResults(match) {
    const resultsDiv = document.getElementById('matchResults');
    
    let html = `
        <div class="match-score">
            <h3>${match.match_percentage}%</h3>
            <p>Match Score</p>
        </div>
    `;
    
    // Missing skills
    if (match.missing_skills && match.missing_skills.length > 0) {
        html += `
            <div class="missing-skills">
                <h4>Missing Skills (${match.missing_skills.length})</h4>
                <div>
                    ${match.missing_skills.map(skill => `<span class="missing-skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // Recommendations
    if (match.recommendations && match.recommendations.length > 0) {
        html += `
            <div class="recommendations">
                <h4>💡 Recommendations</h4>
                <ul>
                    ${match.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    resultsDiv.innerHTML = html;
}

// Chat functionality
function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    if (!resumeUploaded) {
        addChatMessage('bot', 'Please upload your resume first to get personalized advice.');
        return;
    }
    
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) {
        return;
    }
    
    // Add user message to chat
    addChatMessage('user', message);
    input.value = '';
    
    // Show loading indicator
    const loadingId = addChatMessage('bot', 'Thinking...');
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }
        
        if (data.success) {
            addChatMessage('bot', data.response);
        } else {
            addChatMessage('bot', 'Error: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }
        
        addChatMessage('bot', 'Error: ' + error.message);
    }
}

// Add message to chat
function addChatMessage(sender, content) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageId = 'msg-' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `message ${sender}-message`;
    
    // Add avatar for bot messages
    if (sender === 'bot') {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="bi bi-robot"></i>';
        messageDiv.appendChild(avatarDiv);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (sender === 'bot') {
        contentDiv.innerHTML = `<strong>AI Assistant</strong><p>${content}</p>`;
    } else {
        contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return messageId;
}

