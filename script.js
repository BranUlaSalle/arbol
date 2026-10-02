/**
 * Árbol Sintáctico 3D Interactivo
 * Con Efecto Parallax Multi-Plano y Centrado Automático
 * Expresión: (id + id) * id
 */

// Estructura de datos del árbol sintáctico
const treeData = {
  id: "node-1",
  label: "E",
  type: "non-terminal",
  rule: "E → T",
  desc: "Símbolo inicial (Expresión)",
  children: [
    {
      id: "node-2",
      label: "T",
      type: "non-terminal",
      rule: "T → T * F",
      desc: "Término con producto",
      children: [
        {
          id: "node-3",
          label: "T",
          type: "non-terminal",
          rule: "T → F",
          desc: "Término simple",
          children: [
            {
              id: "node-4",
              label: "F",
              type: "non-terminal",
              rule: "F → ( E )",
              desc: "Factor entre paréntesis",
              children: [
                {
                  id: "node-5",
                  label: "(",
                  type: "terminal-paren",
                  rule: "Paréntesis apertura",
                  desc: "Delimitador de agrupación",
                  tokenIndex: 0
                },
                {
                  id: "node-6",
                  label: "E",
                  type: "non-terminal",
                  rule: "E → E + T",
                  desc: "Subexpresión de suma",
                  children: [
                    {
                      id: "node-7",
                      label: "E",
                      type: "non-terminal",
                      rule: "E → T",
                      desc: "Expresión izquierda",
                      children: [
                        {
                          id: "node-8",
                          label: "T",
                          type: "non-terminal",
                          rule: "T → F",
                          desc: "Término izquierdo",
                          children: [
                            {
                              id: "node-9",
                              label: "F",
                              type: "non-terminal",
                              rule: "F → id",
                              desc: "Factor identificador",
                              children: [
                                {
                                  id: "node-10",
                                  label: "id",
                                  type: "terminal-id",
                                  rule: "Identificador",
                                  desc: "Token léxico variable 1",
                                  tokenIndex: 1
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    {
                      id: "node-11",
                      label: "+",
                      type: "terminal-op",
                      rule: "Operador binario",
                      desc: "Suma aritmética",
                      tokenIndex: 2
                    },
                    {
                      id: "node-12",
                      label: "T",
                      type: "non-terminal",
                      rule: "T → F",
                      desc: "Término derecho",
                      children: [
                        {
                          id: "node-13",
                          label: "F",
                          type: "non-terminal",
                          rule: "F → id",
                          desc: "Factor identificador",
                          children: [
                            {
                              id: "node-14",
                              label: "id",
                              type: "terminal-id",
                              rule: "Identificador",
                              desc: "Token léxico variable 2",
                              tokenIndex: 3
                            }
                          ]
                        }
                      ]
                    }
                  ]
                },
                {
                  id: "node-15",
                  label: ")",
                  type: "terminal-paren",
                  rule: "Paréntesis cierre",
                  desc: "Delimitador de agrupación",
                  tokenIndex: 4
                }
              ]
            }
          ]
        },
        {
          id: "node-16",
          label: "*",
          type: "terminal-op",
          rule: "Operador binario",
          desc: "Multiplicación",
          tokenIndex: 5
        },
        {
          id: "node-17",
          label: "F",
          type: "non-terminal",
          rule: "F → id",
          desc: "Factor multiplicador",
          children: [
            {
              id: "node-18",
              label: "id",
              type: "terminal-id",
              rule: "Identificador",
              desc: "Token léxico variable 3",
              tokenIndex: 6
            }
          ]
        }
      ]
    }
  ]
};

// Referencias del DOM
const treeContainer = document.getElementById("tree-container");
const connectionsSvg = document.getElementById("connections-svg");
const world3D = document.getElementById("world-3d");
const sceneContainer = document.getElementById("scene-container");
const particlesContainer = document.getElementById("parallax-particles");

const rotXValue = document.getElementById("rot-x-val");
const rotYValue = document.getElementById("rot-y-val");
const zoomValue = document.getElementById("zoom-val");

const btnAutoRotate = document.getElementById("btn-auto-rotate");
const btnReset = document.getElementById("btn-reset");
const btnReplay = document.getElementById("btn-replay");
const btnGrammar = document.getElementById("btn-grammar");
const grammarDrawer = document.getElementById("grammar-drawer");

// Estado 3D, Cámara y Parallax
let state = {
  rotX: 10,
  rotY: 0,
  targetRotX: 10,
  targetRotY: 0,
  
  zoom: 1,
  panX: 0,
  panY: 0,
  
  // Parallax offsets
  targetParallaxX: 0,
  targetParallaxY: 0,
  currParallaxX: 0,
  currParallaxY: 0,
  normMouseX: 0,
  normMouseY: 0,

  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  autoRotate: false,
  autoRotateAngle: 0
};

// Mapa de relaciones padre-hijo y elementos del nodo
const nodeRegistry = new Map();
const parentMap = new Map();

// Partículas flotantes para Parallax de fondo
let particles = [];

/**
 * Inicializa partículas flotantes con diferentes profundidades Z (Parallax)
 */
function initParallaxParticles() {
  if (!particlesContainer) return;
  particlesContainer.innerHTML = "";
  particles = [];

  const symbols = ['λ', 'id', '+', '*', '(', ')', 'E', 'T', 'F', '→', '{ }', '0', '1', 'β', 'α'];
  const count = 28;

  for (let i = 0; i < count; i++) {
    const pElem = document.createElement("div");
    pElem.className = "floating-particle";
    pElem.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const baseX = Math.random() * 100; // porcentaje de pantalla
    const baseY = Math.random() * 100;
    // Profundidad Z de -180px a +110px para parallax escalonado
    const zDepth = (Math.random() * 290) - 180;
    const opacity = 0.15 + (Math.abs(zDepth) / 200) * 0.25;
    const scale = 0.75 + (zDepth + 180) / 360 * 0.7;

    pElem.style.left = `${baseX}%`;
    pElem.style.top = `${baseY}%`;
    pElem.style.opacity = opacity.toFixed(2);
    pElem.style.fontSize = `${11 * scale}px`;

    particlesContainer.appendChild(pElem);

    particles.push({
      element: pElem,
      z: zDepth,
      baseX: baseX,
      baseY: baseY,
      factor: zDepth / 70 // factor de desplazamiento parallax según profundidad
    });
  }
}

/**
 * Actualiza las partículas parallax según la posición normalizada del cursor
 */
function updateParallaxParticles() {
  const normX = state.normMouseX;
  const normY = state.normMouseY;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const shiftX = normX * p.factor * 18;
    const shiftY = normY * p.factor * 15;
    p.element.style.transform = `translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, ${p.z}px)`;
  }
}

/**
 * Renderiza el árbol recursivamente en elementos HTML con estructura flex
 */
function createTreeNodeElement(node, depth = 0) {
  const branchDiv = document.createElement("div");
  branchDiv.className = "tree-branch";

  // Tarjeta del nodo
  const nodeCard = document.createElement("div");
  nodeCard.id = node.id;
  nodeCard.className = `node-card ${node.type} animate-entrance`;
  nodeCard.style.animationDelay = `${depth * 0.08}s`;
  
  // Elevación escalonada según nivel para efecto parallax en profundidad
  const depthZ = Math.max(18, 76 - depth * 7.5);
  nodeCard.style.setProperty("--depth-z", `${depthZ}px`);

  nodeCard.dataset.label = node.label;
  nodeCard.dataset.type = node.type;
  if (node.tokenIndex !== undefined) {
    nodeCard.dataset.tokenIndex = node.tokenIndex;
  }

  // Contenido del nodo con micro-parallax
  nodeCard.innerHTML = `
    <span class="node-text">${node.label}</span>
    <div class="node-tooltip">
      <div class="tooltip-title">${node.rule}</div>
      <div class="tooltip-rule">${node.desc}</div>
    </div>
  `;

  // Registrar nodo
  nodeRegistry.set(node.id, {
    element: nodeCard,
    data: node,
    depth: depth
  });

  // Eventos de interacción con el ratón
  nodeCard.addEventListener("mouseenter", () => handleNodeHover(node.id, true));
  nodeCard.addEventListener("mouseleave", () => handleNodeHover(node.id, false));

  branchDiv.appendChild(nodeCard);

  // Subramas (hijos)
  if (node.children && node.children.length > 0) {
    const subbranchesDiv = document.createElement("div");
    subbranchesDiv.className = "tree-subbranches";

    node.children.forEach(child => {
      parentMap.set(child.id, node.id);
      const childElem = createTreeNodeElement(child, depth + 1);
      subbranchesDiv.appendChild(childElem);
    });

    branchDiv.appendChild(subbranchesDiv);
  }

  return branchDiv;
}

/**
 * Obtiene la posición acumulada de un elemento respecto a un contenedor ancestro
 */
function getOffsetRelativeTo(element, container) {
  let x = 0;
  let y = 0;
  let curr = element;
  while (curr && curr !== container) {
    x += curr.offsetLeft;
    y += curr.offsetTop;
    curr = curr.offsetParent;
  }
  return { x, y };
}

/**
 * Dibuja las líneas curvas SVG entre todos los nodos padre e hijos
 */
function updateConnections() {
  if (!treeContainer || !connectionsSvg) return;

  const w = treeContainer.offsetWidth;
  const h = treeContainer.offsetHeight;
  connectionsSvg.setAttribute("width", w);
  connectionsSvg.setAttribute("height", h);
  connectionsSvg.style.width = `${w}px`;
  connectionsSvg.style.height = `${h}px`;

  connectionsSvg.innerHTML = "";

  parentMap.forEach((parentId, childId) => {
    const parent = nodeRegistry.get(parentId);
    const child = nodeRegistry.get(childId);

    if (!parent || !child) return;

    const pPos = getOffsetRelativeTo(parent.element, treeContainer);
    const cPos = getOffsetRelativeTo(child.element, treeContainer);

    // Conectar desde el centro inferior del padre al centro superior del hijo
    const x1 = pPos.x + parent.element.offsetWidth / 2;
    const y1 = pPos.y + parent.element.offsetHeight;

    const x2 = cPos.x + child.element.offsetWidth / 2;
    const y2 = cPos.y;

    // Curva Bezier cúbica fluida
    const dy = y2 - y1;
    const cp1x = x1;
    const cp1y = y1 + dy * 0.55;
    const cp2x = x2;
    const cp2y = y1 + dy * 0.45;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`);
    path.setAttribute("class", "branch-path");
    path.id = `edge-${parentId}-${childId}`;

    connectionsSvg.appendChild(path);
  });
}

/**
 * Centra perfectamente el árbol en el visor considerando las dimensiones de la ventana
 */
function centerTree() {
  if (!treeContainer || !sceneContainer) return;

  const sceneRect = sceneContainer.getBoundingClientRect();
  const treeW = treeContainer.offsetWidth;
  const treeH = treeContainer.offsetHeight;

  if (sceneRect.width === 0 || treeW === 0) return;

  // Calcular zoom óptimo con margen de respiración
  const padX = 60;
  const padY = 40;
  const scaleX = (sceneRect.width - padX * 2) / treeW;
  const scaleY = (sceneRect.height - padY * 2) / treeH;
  
  const idealZoom = Math.min(1.0, Math.min(scaleX, scaleY));
  state.zoom = Math.max(0.62, Math.min(1.05, idealZoom));

  // Restablecer desplazamientos y centrar
  state.panX = 0;
  state.panY = 0;
  state.targetRotX = 8;
  state.targetRotY = 0;
  state.autoRotate = false;
  if (btnAutoRotate) btnAutoRotate.classList.remove("active");

  setTimeout(updateConnections, 120);
}

/**
 * Resaltado interactivo de camino (ancestros y descendientes)
 */
function handleNodeHover(nodeId, isHovered) {
  const node = nodeRegistry.get(nodeId);
  if (!node) return;

  let curr = nodeId;
  while (parentMap.has(curr)) {
    const parentId = parentMap.get(curr);
    const edge = document.getElementById(`edge-${parentId}-${curr}`);
    const parentNode = nodeRegistry.get(parentId);

    if (edge) {
      if (isHovered) {
        edge.classList.add("active");
      } else {
        edge.classList.remove("active");
      }
    }
    if (parentNode) {
      if (isHovered) {
        parentNode.element.classList.add("path-highlighted");
      } else {
        parentNode.element.classList.remove("path-highlighted");
      }
    }
    curr = parentId;
  }

  // Resaltar token en barra superior
  if (node.data.tokenIndex !== undefined) {
    const tokenSpan = document.getElementById(`token-${node.data.tokenIndex}`);
    if (tokenSpan) {
      if (isHovered) {
        tokenSpan.classList.add("highlighted");
      } else {
        tokenSpan.classList.remove("highlighted");
      }
    }
  }
}

/**
 * Bucle de animación 3D continuo con interpolación y Parallax
 */
function render3DLoop() {
  if (state.autoRotate) {
    state.autoRotateAngle += 0.008;
    state.targetRotY = Math.sin(state.autoRotateAngle) * 20;
    state.targetRotX = 8 + Math.cos(state.autoRotateAngle * 0.8) * 8;
    state.targetParallaxX = Math.sin(state.autoRotateAngle) * 20;
    state.targetParallaxY = Math.cos(state.autoRotateAngle * 0.8) * 15;
  }

  // Interpolación lerp suave de rotación y parallax
  state.rotX += (state.targetRotX - state.rotX) * 0.085;
  state.rotY += (state.targetRotY - state.rotY) * 0.085;
  state.currParallaxX += (state.targetParallaxX - state.currParallaxX) * 0.085;
  state.currParallaxY += (state.targetParallaxY - state.currParallaxY) * 0.085;

  // Sutil balanceo en el eje Y
  const floatY = Math.sin(Date.now() * 0.0016) * 5;

  // Aplicar transformación 3D combinando rotación, zoom y parallax
  world3D.style.transform = `
    translate(${state.panX + state.currParallaxX}px, ${state.panY + state.currParallaxY + floatY}px)
    scale(${state.zoom})
    rotateX(${state.rotX.toFixed(2)}deg)
    rotateY(${state.rotY.toFixed(2)}deg)
  `;

  // Actualizar partículas parallax
  updateParallaxParticles();

  // Actualizar indicadores numéricos en HUD
  if (rotXValue) rotXValue.textContent = `${state.rotX.toFixed(1)}°`;
  if (rotYValue) rotYValue.textContent = `${state.rotY.toFixed(1)}°`;
  if (zoomValue) zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;

  requestAnimationFrame(render3DLoop);
}

/**
 * Eventos del ratón para interactividad y Efecto Parallax
 */
function setupInteractions() {
  window.addEventListener("mousemove", (e) => {
    // Coordenadas normalizadas (-1 a +1) respecto al centro de la ventana
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const normX = (e.clientX - cx) / cx;
    const normY = (e.clientY - cy) / cy;

    state.normMouseX = normX;
    state.normMouseY = normY;

    // Actualizar variables CSS para el fondo parallax y spotlight
    document.documentElement.style.setProperty("--mouse-norm-x", normX.toFixed(3));
    document.documentElement.style.setProperty("--mouse-norm-y", normY.toFixed(3));
    document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);

    if (state.isDragging) {
      // Arrastre manual con clic
      const deltaX = e.clientX - state.lastMouseX;
      const deltaY = e.clientY - state.lastMouseY;
      
      if (e.buttons === 1) { // Click izquierdo para rotar
        state.targetRotY += deltaX * 0.25;
        state.targetRotX -= deltaY * 0.25;
        state.targetRotX = Math.max(-45, Math.min(45, state.targetRotX));
      } else if (e.buttons === 2 || e.shiftKey) { // Click derecho o shift para desplazar (pan)
        state.panX += deltaX;
        state.panY += deltaY;
      }

      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    } else if (!state.autoRotate) {
      // EFECTO PARALLAX: Desplazamiento dinámico en profundidad y rotación con el cursor
      state.targetRotY = normX * 22;
      state.targetRotX = -normY * 18 + 8;
      
      // Desplazamiento de plano (Parallax Shift)
      state.targetParallaxX = normX * 36;
      state.targetParallaxY = normY * 26;
    }
  });

  // Mousedown para inicio de arrastre
  sceneContainer.addEventListener("mousedown", (e) => {
    state.isDragging = true;
    state.lastMouseX = e.clientX;
    state.lastMouseY = e.clientY;
  });

  window.addEventListener("mouseup", () => {
    state.isDragging = false;
  });

  sceneContainer.addEventListener("contextmenu", (e) => e.preventDefault());

  // Zoom con rueda del ratón
  sceneContainer.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    state.zoom = Math.min(Math.max(0.4, state.zoom * zoomFactor), 2.2);
    updateConnections();
  }, { passive: false });

  // Botón modo órbita
  if (btnAutoRotate) {
    btnAutoRotate.addEventListener("click", () => {
      state.autoRotate = !state.autoRotate;
      btnAutoRotate.classList.toggle("active", state.autoRotate);
    });
  }

  // Botón restablecer y recentrar
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      centerTree();
    });
  }

  // Botón repetir animación de entrada
  if (btnReplay) {
    btnReplay.addEventListener("click", () => {
      nodeRegistry.forEach(node => {
        node.element.classList.remove("animate-entrance");
        void node.element.offsetWidth;
        node.element.classList.add("animate-entrance");
      });
      setTimeout(updateConnections, 400);
    });
  }

  // Botón gramática
  if (btnGrammar && grammarDrawer) {
    btnGrammar.addEventListener("click", () => {
      grammarDrawer.classList.toggle("collapsed");
      btnGrammar.classList.toggle("active");
    });
  }

  // Recalcular dimensiones y recentrar en resize
  window.addEventListener("resize", () => {
    centerTree();
  });
}

/**
 * Inicialización
 */
function init() {
  treeContainer.innerHTML = "";
  const treeRoot = createTreeNodeElement(treeData);
  treeContainer.appendChild(treeRoot);

  initParallaxParticles();
  setupInteractions();
  requestAnimationFrame(render3DLoop);

  // Centrar y conectar
  setTimeout(() => {
    centerTree();
    updateConnections();
  }, 100);

  setTimeout(() => {
    centerTree();
    updateConnections();
  }, 700);
}

document.addEventListener("DOMContentLoaded", init);
