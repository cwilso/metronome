function setAttrs(element) {
  return ([name, value]) => {
    element.setAttribute(name, value);
  };
}

/**
 *
 * @param {*} tag
 * @param {*} attributes
 * @param  {...any} content
 * @returns
 */
export function create(tag, attributes = {}, ...content) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(setAttrs(element));
  if (content)
    content.forEach((c) => {
      if (typeof c === `string`) {
        c = document.createTextNode(c);
      }
      element.appendChild(c);
    });
  return element;
}

function setListeners(element) {
  return ([eventType, listener]) => {
    element.addEventListener(eventType, listener);
  };
}

/**
 *
 * @param {*} element
 * @param {*} handlers
 */
export function listen(element, handlers = {}) {
  Object.entries(handlers).forEach(setListeners(element));
}

/**
 *
 * @param {*} arr1
 * @param {*} arr2
 * @returns
 */
export function getDifference(arr1, arr2) {
  return arr1.map((v, i) => arr2[i] !== v);
}
