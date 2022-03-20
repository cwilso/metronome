const create = (tag) => document.createElement(tag);

function slider(options, container = undefined) {
  options.value ??= 0;
  options.step ??= 1.0;
  const { change, input, ...attributes } = options;
  const step = parseFloat(attributes.step);

  const slider = create(`input`);
  slider.setAttribute(`type`, `range`);
  slider.setAttribute(`tabIndex`, 0);
  Object.entries(attributes).forEach(([name, val]) => {
    slider.setAttribute(name, val);
  });
  if (input) slider.addEventListener(`input`, input);
  else if (change) slider.addEventListener(`change`, change);

  slider.addEventListener(`keydown`, ({ key }) => {
    if (key === `Arrow Up`) {
      console.log(`up`);
      slider.value = parseFloat(slider.value) + step;
    }
    if (key === `Arrow Down`) {
      console.log(`down`);
      slider.value = parseFloat(slider.value) - step;
    }
    console.log(key, slider.value, step);
  });

  if (container) container.append(slider);
  return slider;
}

export { slider };
