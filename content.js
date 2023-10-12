
if (window.location.pathname === "/watch" || window.location.pathname === "/") {

  function getTargetElement() {
    // Homepage
    let targetElement = document.querySelector("ytd-two-column-browse-results-renderer.style-scope.ytd-browse.grid.grid-disabled");

    // Target for subscriptions page
    if (!targetElement) {
      targetElement = document.querySelector("#page-manager > ytd-browse > ytd-two-column-browse-results-renderer");
    }

    // Target for video page
    if (!targetElement) {
      targetElement = document.querySelector("#related.style-scope.ytd-watch-flexy");
    }

    return targetElement;
  }


  
async function fetchData(enabled_ids, filterWords, boostWords) {
  const targetElement = getTargetElement();
  if (!targetElement) return false;

  const url = 'https://openalgos.ai/videos';
  const headers = {'Accept': 'text/html'};
  const params = {
      algo_ids: enabled_ids,
      filter_words: filterWords.join(","),
      boost_words: boostWords.join(",")
  };

  const searchParams = Object.keys(params).map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
  const urlWithParams = url + '?' + searchParams;

  try {
      const response = await fetch(urlWithParams, { headers });
      const data = await response.text();
      targetElement.innerHTML = data;
      return true;
  } catch (error) {
      console.error('Error fetching data:', error);
      return false;
  }
}

function getChromeStorageData(keys) {
  return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (result) => {
          resolve(result);
      });
  });
}


async function getDataAndFetch() {
  const data = await getChromeStorageData(['enabled', 'filterWords', 'boostWords']);
  if (data.enabled && data.enabled.length > 0) {
      const enabled = data.enabled;
      const filterWords = data.filterWords || [];
      const boostWords = data.boostWords || [];
      return await fetchData(enabled, filterWords, boostWords);
  }
  return false;
}



  let attempts = 0;

  async function tryFetchData() {
    console.log('tryFetchData', attempts);
    const success = await getDataAndFetch();
  
    if (!success && attempts < 5) {
      console.log('tryFetchData failed, retrying');
      attempts++;
      setTimeout(tryFetchData, 250);  // Retry after 250ms delay
    }
  }
  
  tryFetchData();


  function handleUrlChange() {
    tryFetchData();
}

// Overriding the pushState method
const originalPushState = history.pushState;
history.pushState = function() {
    originalPushState.apply(history, arguments);
    handleUrlChange();
};

// Overriding the replaceState method
const originalReplaceState = history.replaceState;
history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    handleUrlChange();
};

// Handle popstate event
window.addEventListener('popstate', handleUrlChange);

// Use MutationObserver to detect changes in the title (indicative of a page change)
const titleObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
            handleUrlChange();
        }
    });
});

const config = { childList: true };
titleObserver.observe(document.querySelector('title'), config);



  // adding listener to chrome storage
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let key in changes) {
      if (key === 'enabled') {
        const enabled = changes[key].newValue;
        if (enabled && enabled.length > 0) {
          tryFetchData();
        } else {
          location.reload();
        }
      } else if (key === 'filterWords' || key === 'boostWords') {
        tryFetchData();
      }
    }
  });
}


