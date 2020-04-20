/**
 * Creates a event listener to respond to client requests.
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * Responds to requests from the client.
 * @param {Request} request
 */
async function handleRequest(request) {
  const data = await fetchWebpageVariants();

  if (!data) {
    return new Response("Failed to fetch webpage variants. Please try again.");
  }

  const webpageVariants = data.variants;
  const URL = getURLToRequest(webpageVariants);

  if (!URL) {
    return new Response("Failed to request a webpage variant to display. Please try again.");
  }

  const response = await requestWebpage(URL);
  const modifiedResponse = new HTMLRewriter().on('*', new ElementHandler()).transform(response);

  return new Response(modifiedResponse.body);
}

/**
 * Randomly selects an URL from a given list of webpages.
 * @param {Array<String>} webpages list of webpage URLs to be randomly selected
 * @returns {String} an URL from the list of webpages
 */
function getURLToRequest(webpages) {
  let url = null;

  if (Array.isArray(webpages)) {
    const numOfWebpages = webpages.length;
    const index = Math.floor(Math.random() * numOfWebpages); // generates random index from 0 to the total number of webpage variants 
    url = webpages[index];
  }

  return url;
}

/**
 * Requests a webpage with a given URL.
 * @param {String} url the url to request
 * @returns {Response} Response object containing the webpage data
 */
async function requestWebpage(url) {
  let response = await fetchWrapper(url);
  return response;
}

/**
 * Fetches the webpage variants from Cloudfare's webpage variants API endpoint.
 * @returns {Object} JSON containing a list of the webpage variant URLs, else null if fetching was unsuccessful 
 */
async function fetchWebpageVariants() {
  const URL = "https://cfw-takehome.developers.workers.dev/api/variants";
  const response = await fetchWrapper(URL);
  const data = response ? response.json() : null;
  return data;
}

/**
 * Wrapper to fetch and handle errors with the Fetch API's fetch().
 * @param {String} url resource to fetch
 * @returns {Response} Response object containing the resource's data, else null for failed fetches
 */
async function fetchWrapper(url) {
  try {
    let response = await fetch(url);
    response = handleErrors(response);
    return response;
  } catch (error) {
    console.log(error.message);
  }

  return null;
}

/**
 * Custom error handler for handling fetch responses
 * @param {Response} response Response to process 
 */
function handleErrors(response) {
  if (!response.ok) {
    throw Error("An error occurred during a fetch. Status: " + response.statusText);
  }
  return response;
}

/**
 * Handler class to help manipulate elements on a webpage with HTMLRewriter.
 */
class ElementHandler {
  
  constructor() {
    // Using a Map as a data-driven approach to organize and change the HTML elements by id.
    // Ideally data should be passed into this contructor so that it can be reusable.
    // But for the purposes of learning and demenstrating, data is hardcoded here for now
    this.elementsById = new Map();
    this.elementsById.set("title", 
      {attributesToReplace: [], 
        newInnerContent: "Tony Chen's Custom Variant"});
    this.elementsById.set("description", 
      {attributesToReplace: [], 
        newInnerContent: "This is my custom variant description! I really enjoyed working on this internship assignment."});
    this.elementsById.set("url", 
      {attributesToReplace: [{key: "href", value: "https://www.linkedin.com/in/tonychen-dev/"}], 
        newInnerContent: "Go to Tony's LinkedIn"});

    this.ids = [...this.elementsById.keys()];
  }

  element(element) {
    const TARGET_ATTRIBUTE = "id";

    // Modify the title tag of the webpage
    if (element.tagName === "title") {
      element.prepend("Custom ");
    }

    // Modify incoming elements by id
    if (element.hasAttribute(TARGET_ATTRIBUTE)) {
      for (const id of this.ids) {
        if (element.getAttribute(TARGET_ATTRIBUTE) === id) {
          const customContent = this.elementsById.get(id);
          const attributesToReplace = customContent.attributesToReplace;
          const newInnerContent = customContent.newInnerContent;
          element.setInnerContent(newInnerContent);

          if (attributesToReplace.length > 0) {
            for (const attribute of attributesToReplace) {
              element.setAttribute(attribute.key, attribute.value);
            }
          }
        }
      }
    }
  }
}
