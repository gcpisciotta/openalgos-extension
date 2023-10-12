// define randomInt

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


document.addEventListener("DOMContentLoaded", function () {

    // Retrieve the saved algos from chrome storage and pre-select them
    chrome.storage.sync.get(['algos', 'filterWords', 'enabled', 'boostWords'], function (data) {
        const selectedAlgos = data.algos || [];
        const enabledAlgos = data.enabled || []; // <- Fetching the enabled algorithms
        const filterWords = data.filterWords || [];
        const boostWords = data.boostWords || [];

        if (filterWords) {
            displayFilterWords(filterWords);
        }

        if (boostWords) {
            displayBoostWords(boostWords);
        }

        // Event Listener to add filter words
        document.getElementById("set-filter-word").addEventListener("click", function () {
            updateFilterWords();
        });

        // Event Listener to add boost words
        document.getElementById("set-boost-word").addEventListener("click", function () {
            updateBoostWords();
        });




        document.getElementById('search-algo-btn').addEventListener('click', function () {
            const searchTerm = document.getElementById('search-algos').value.trim();
            fetchAlgorithms(selectedAlgos, enabledAlgos, searchTerm);
        });

        // Fetch the algos from the backend on page load
        fetchAlgorithms(selectedAlgos, enabledAlgos);
    });


    function fetchAlgorithms(selectedAlgos, enabledAlgos, searchTerm = null) {
        let apiUrl = 'https://openalgos.ai/algos';
        if (searchTerm) {
            apiUrl += `?search=${searchTerm}`;
        }

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const algoList = document.getElementById('algo-list');
                algoList.innerHTML = ''; // Clear the existing list first
                if (data.status === "success") {
                    const algos = data.data;
                    const algoList = document.getElementById("algo-list");
                    const profileAlgoList = document.getElementById("profile-algo-list");

                    console.log("algoList: ", algoList);
                    console.log("profileAlgoList: ", profileAlgoList);


                    algos.forEach(algo => {
                        algo.description = algo.description || "This is a preset algorithm from OpenAlgos.";
                        const card = createAlgoCard(algo, selectedAlgos, false, enabledAlgos);
                        if (selectedAlgos.includes(algo.id)) {
                            card.classList.add("selected");
                            const profileCard = createAlgoCard(algo, selectedAlgos, true, enabledAlgos);
                            profileAlgoList.appendChild(profileCard);
                        }
                        algoList.appendChild(card);
                    });
                } else {
                    algoList.innerHTML = '<p>Popular Algorithms</p>'; // Default message if no data or on failure
                }
            })
            .catch(error => {
                console.error('Error fetching algos:', error);
            });
    }

    // Handles menu bar and tab content
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            menuItems.forEach(i => i.classList.remove('selected'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            this.classList.add('selected');
            const contentId = this.getAttribute('data-tab');
            document.getElementById(contentId).classList.add('active');
        });
    });

    // Handles switching to the marketplace tab
    document.getElementById('switch-to-marketplace').addEventListener('click', function () {
        menuItems.forEach(i => i.classList.remove('selected'));
        tabContents.forEach(tab => tab.classList.remove('active'));

        let marketMenuTab = document.getElementById('marketplace-tab');
        let marketTab = document.getElementById('marketplace');

        marketMenuTab.classList.add('selected');
        marketTab.classList.add('active');
    });

    function createAlgoCard(algo, selectedAlgos, profile = false, enabledAlgos = []) {
        const card = document.createElement("div");
        card.className = "algo-card";
        card.dataset.id = algo.id;

        // Indicator arrow, initially pointing down
        const expandCard = document.createElement("span");
        expandCard.className = "expand-card";
        // expandCard.textContent = "Click to expand";
        expandCard.textContent = "Details +";

        // Description, hidden by default
        const descriptionLabel = document.createElement("u");
        descriptionLabel.textContent = "About:";

        const descriptionContent = document.createElement("div");
        descriptionContent.textContent = algo.description;

        const description = document.createElement("div");
        description.className = "algo-description";
        description.appendChild(descriptionLabel);
        // description.appendChild(document.createElement("br"));  // Line break
        description.appendChild(descriptionContent);
        description.style.display = "none";

        card.addEventListener("click", function () {
            if (description.style.display === "none") {
                console.log('this', this)
                let expandCard = this.querySelector('.expand-card')
                // expandCard.textContent = "Details -";
                expandCard.style.display = "none";
                description.style.display = "block";
                // expandCard.textContent = "Expanded";
            } else {
                description.style.display = "none";
                let expandCard = this.querySelector('.expand-card')
                expandCard.textContent = "Details +";
                expandCard.style.display = "block";
            }
        });

        const cardBasic = document.createElement("div");
        cardBasic.className = "algo-card-basic";
        cardBasic.innerHTML = `
        <img src="${algo.icon_url}" alt="${algo.title}">
        <div class="algo-card-basic-content">
            <strong>${algo.title}</strong>
            <br>
            <span>By ${algo.creator_name}</span>
            <br>
            ${expandCard.outerHTML}
        </div>
    `;

        if (profile) {
            card.classList.add("profile");
            const removeButton = document.createElement("button");
            removeButton.textContent = "Unsubscribe";
            removeButton.className = "remove-algo-btn";
            removeButton.addEventListener("click", function (e) {
                e.stopPropagation();
                removeFromSelected(algo.id);

                // cast algo.id to str
                const element = document.querySelector(`.algo-card.marketplace[data-id="${algo.id}"]`);
                const actionButton = element.querySelector('.action-btn')
                if (actionButton) {
                    actionButton.textContent = "Add";
                    actionButton.classList.remove("remove-btn");
                    actionButton.classList.add("add-btn");
                }

            });
            description.appendChild(removeButton);

            // Toggle switch for enabling/disabling algo
            const toggleWrapper = document.createElement("div");
            toggleWrapper.className = "algo-toggle-wrapper";

            const toggleLabel = document.createElement("label");
            toggleLabel.className = "switch";

            const toggleInput = document.createElement("input");
            toggleInput.type = "checkbox";
            toggleInput.className = "algo-toggle";
            if (enabledAlgos.includes(algo.id)) {
                toggleInput.checked = true;
            }
            toggleInput.addEventListener("change", function () {
                if (this.checked) {
                    addToEnabled(algo.id);
                } else {
                    removeFromEnabled(algo.id);
                }
            });

            const toggleSlider = document.createElement("span");
            toggleSlider.className = "slider round";

            toggleLabel.appendChild(toggleInput);
            toggleLabel.appendChild(toggleSlider);
            toggleWrapper.appendChild(toggleLabel);

            cardBasic.appendChild(toggleWrapper);
        } else {
            card.classList.add("marketplace");            
            const actionButton = document.createElement("button");
            actionButton.classList.add("action-btn");
            if (selectedAlgos.includes(algo.id)) {
                actionButton.textContent = "Added";
                actionButton.classList.add("remove-btn");
            } else {
                actionButton.textContent = "Add";
                actionButton.classList.add("add-btn");
            }
            actionButton.addEventListener("click", function (e) {
                e.stopPropagation();
                if (this.textContent === "Add") {
                    this.textContent = "Added";
                    this.classList.remove("add-btn");
                    this.classList.add("remove-btn");
                    addToSelected(algo.id);
                    // show newly added algo in profile
                    const profileAlgoList = document.getElementById("profile-algo-list");
                    const profileCard = createAlgoCard(algo, selectedAlgos, true, enabledAlgos + [algo.id]);
                    profileCard.classList.add("selected");
                    profileAlgoList.appendChild(profileCard);

                } else {
                    this.textContent = "Add";
                    this.classList.remove("remove-btn");
                    this.classList.add("add-btn");
                    removeFromSelected(algo.id);
                }
            });
            cardBasic.appendChild(actionButton);
        }

        card.appendChild(cardBasic);
        card.appendChild(description);

        return card;
    }


    function addToEnabled(id) {
        chrome.storage.sync.get(['enabled'], function (data) {
            const enabledAlgos = data.enabled || [];
            if (!enabledAlgos.includes(id)) {
                enabledAlgos.push(id);
                chrome.storage.sync.set({ 'enabled': enabledAlgos });
            }
        });
    }

    function removeFromEnabled(id) {
        chrome.storage.sync.get(['enabled'], function (data) {
            const enabledAlgos = data.enabled || [];
            const index = enabledAlgos.indexOf(id);
            if (index !== -1) {
                enabledAlgos.splice(index, 1);
                chrome.storage.sync.set({ 'enabled': enabledAlgos });
            }
        });
    }


    function addToSelected(id) {
        chrome.storage.sync.get(['algos'], function (data) {
            const selectedAlgos = data.algos || [];
            if (!selectedAlgos.includes(id)) {
                selectedAlgos.push(id);
                chrome.storage.sync.set({ 'algos': selectedAlgos }, function () {
                    console.log('Added algo with id:', id);
                    addToEnabled(id);  // Add to enabled list as well
                });
            }
        });
        
    }


    function removeFromSelected(id) {
        chrome.storage.sync.get(['algos'], function (data) {
            const selectedAlgos = data.algos || [];
            const index = selectedAlgos.indexOf(id);
            if (index !== -1) {
                selectedAlgos.splice(index, 1);
                chrome.storage.sync.set({ 'algos': selectedAlgos }, function () {
                    console.log('Removed algo with id:', id);

                    // Remove the profile algo card from the DOM
                    const profileAlgoList = document.getElementById("profile-algo-list");
                    const cardToRemove = profileAlgoList.querySelector(`[data-id="${id}"]`);
                    if (cardToRemove) {
                        profileAlgoList.removeChild(cardToRemove);
                    }
                    removeFromEnabled(id);  // Remove from enabled list as well
                });
            }
        });
        
    }




    function displayFilterWords(filterWords) {
        const filterContainer = document.getElementById('filter-words-container'); // This container will hold the filter badges
        filterContainer.innerHTML = ''; // Clear previous badges

        filterWords.forEach(word => {
            const badge = document.createElement('span');
            badge.className = 'filter-badge';
            badge.textContent = word;

            const removeIcon = document.createElement('span');
            removeIcon.className = 'remove-filter';
            removeIcon.addEventListener('click', function (e) {
                e.stopPropagation();
                // remove this word from filterWords array and update the storage
                const index = filterWords.indexOf(word);
                if (index > -1) {
                    filterWords.splice(index, 1);
                    chrome.storage.sync.set({ 'filterWords': filterWords }, function () {
                        console.log('Removed word:', word);
                    });
                }
                badge.remove(); // remove the badge from the DOM
            });
            badge.appendChild(removeIcon);
            filterContainer.appendChild(badge);
        });
    }

    function updateFilterWords() {
        const filterWordsInput = document.getElementById("filter-words");
        const filterWord = filterWordsInput.value.trim();
        if (filterWord) {
            chrome.storage.sync.get(['filterWords'], function (data) {
                const filterWords = data.filterWords || [];
                if (!filterWords.includes(filterWord)) {
                    filterWords.push(filterWord);
                    chrome.storage.sync.set({ 'filterWords': filterWords }, function () {
                        console.log('Added word:', filterWord);
                        displayFilterWords(filterWords); // Display the badges after updating
                        filterWordsInput.value = ""; // Clear the input field
                    });
                } else {
                    console.log('Word already exists:', filterWord);
                }
            });
        }
    }

    function displayBoostWords(boostWords) {
        const boostContainer = document.getElementById('boost-words-container');
        boostContainer.innerHTML = '';

        boostWords.forEach(word => {
            const badge = document.createElement('span');
            badge.className = 'filter-badge';
            badge.textContent = word;

            const removeIcon = document.createElement('span');
            removeIcon.className = 'remove-filter';
            removeIcon.addEventListener('click', function (e) {
                e.stopPropagation();
                const index = boostWords.indexOf(word);
                if (index > -1) {
                    boostWords.splice(index, 1);
                    chrome.storage.sync.set({ 'boostWords': boostWords }, function () {
                        console.log('Removed boost word:', word);
                    });
                }
                badge.remove();
            });
            badge.appendChild(removeIcon);
            boostContainer.appendChild(badge);
        });
    }

    function updateBoostWords() {
        const boostWordInput = document.getElementById("boost-words");
        const boostWord = boostWordInput.value.trim();
        if (boostWord) {
            chrome.storage.sync.get(['boostWords'], function (data) {
                const boostWords = data.boostWords || [];
                if (!boostWords.includes(boostWord)) {
                    boostWords.push(boostWord);
                    chrome.storage.sync.set({ 'boostWords': boostWords }, function () {
                        displayBoostWords(boostWords);
                        boostWordInput.value = "";
                    });
                } else {
                    console.log('Boost word already exists:', boostWord);
                }
            });
        }
    }
});