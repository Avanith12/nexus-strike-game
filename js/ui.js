function showProject(projectId) {
    document.querySelectorAll('.project-section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(projectId).classList.add('active');
    event.target.classList.add('active');
}

function startGame() {
    document.getElementById('storyIntro').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';

    if (typeof init === 'function') {
        init();
    }
}

function toggleInstructions() {
    const instructions = document.getElementById('instructions');
    const toggleBtn = document.getElementById('toggleInstructions');

    if (instructions.classList.contains('collapsed')) {
        instructions.classList.remove('collapsed');
        instructions.classList.add('expanded');
        toggleBtn.textContent = 'HIDE CONTROLS';
    } else {
        instructions.classList.remove('expanded');
        instructions.classList.add('collapsed');
        toggleBtn.textContent = 'SHOW CONTROLS';
    }
}

window.toggleInstructions = toggleInstructions;

function toggleMapSelection() {
    const mapPanel = document.getElementById('mapSelection');
    const mapContent = document.getElementById('mapContent');
    const toggleBtn = document.getElementById('toggleMapSelection');

    if (mapPanel.classList.contains('collapsed')) {
        mapPanel.classList.remove('collapsed');
        mapPanel.classList.add('expanded');
        mapContent.classList.remove('collapsed');
        mapContent.classList.add('expanded');
        toggleBtn.textContent = 'HIDE MAPS';
    } else {
        mapPanel.classList.remove('expanded');
        mapPanel.classList.add('collapsed');
        mapContent.classList.remove('expanded');
        mapContent.classList.add('collapsed');
        toggleBtn.textContent = 'MAPS';
    }
}
