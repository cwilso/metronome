const { sin, cos, PI } = Math;
const TAU = PI * 2;
const vb = metronome.getAttribute(`viewBox`).split(` `).map(parseFloat);
const c = vb[2] / 2;

function rotate(x, y, a) {
  return [x * cos(a) - y * sin(a), x * sin(a) + y * cos(a)];
}

function generate(levels = 10, highlightFn, activeDivision) {
  const aoffet = (-3 * TAU) / 8;
  const groups = [];
  const gap = 1;
  const thickness = (c - (levels + 1) * gap) / (levels + 1);

  for (let l = 0; l < levels - 1; l++) {
    let g = document.createElementNS(`http://www.w3.org/2000/svg`, `g`);
    groups.push(g);
    g.classList.add(`d${l + 1}`);

    if (l + 1 === activeDivision) {
      g.classList.add(`prominent`);
    }

    const sd = (l + 1) * (thickness + 1);
    const se = sd + (thickness - 1);

    const divs = l === 0 ? l + 4 : (l + 1) * 4;
    const fraction = TAU / divs;

    for (let i = 0; i < divs; i++) {
      let path = document.createElementNS(`http://www.w3.org/2000/svg`, `path`);

      let [x1, y1] = rotate(sd, gap, aoffet + i * fraction);
      let [x2, y2] = rotate(se, gap, aoffet + i * fraction);
      let [x3, y3] = rotate(se, -gap, aoffet + (i + 1) * fraction);
      let [x4, y4] = rotate(sd, -gap, aoffet + (i + 1) * fraction);

      path.setAttribute(
        `d`,
        [
          `M ${c + x1} ${c + y1}`,
          `L ${c + x2} ${c + y2}`,
          `A ${se} ${se} 0 0 1 ${c + x3} ${c + y3}`,
          `L ${c + x4} ${c + y4}`,
          `A ${sd} ${sd} 0 0 0 ${c + x1} ${c + y1}`,
          `Z`,
        ].join(` `)
      );

      if (l === 0) {
        path.classList.add(`q${i}`);
      }

      if (l > 0) {
        path.classList.add(`q${(i / (l + 1)) | 0}`);
      }

      g.appendChild(path);

      g.addEventListener(`click`, () => {
        document
          .querySelectorAll(`.prominent`)
          .forEach((e) => e.classList.remove(`prominent`));
        g.classList.add(`prominent`);
        highlightFn(l + 1);
      });
    }
  }

  metronome.textContent = ``;
  groups.reverse().forEach((g) => metronome.appendChild(g));
}

export { generate as buildCountingWheel };
