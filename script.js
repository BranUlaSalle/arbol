/**
 * Árbol Sintáctico 3D Interactivo
 * Parser tree para la expresión: (id + id) * id
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
const rotXValue = document.getElementById("rot-x-val");
const rotYValue = document.getElementById("rot-y-val");
const zoomValue = document.getElementById("zoom-val");

const btnAutoRotate = document.getElementById("btn-auto-rotate");
const btnReset = document.getElementById("btn-reset");
const btnReplay = document.getElementById("btn-replay");
const btnGrammar = document.getElementById("btn-grammar");
const grammarDrawer = document.getElementById("grammar-drawer");

// Estado 3D y Cámara
let state = {
  rotX: 12,
  rotY: -8,
  targetRotX: 12,
  targetRotY: -8,
  zoom: 1,
  panX: 0,
  panY: 0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  autoRotate: false,
  autoRotateAngle: 0
};

// Mapa de relaciones padre-hijo y elementos del nodo
const nodeRegistry = new Map();
const parentMap = new Map();

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
  nodeCard.style.animationDelay = `${depth * 0.1}s`;
  nodeCard.dataset.label = node.label;
  nodeCard.dataset.type = node.type;
  if (node.tokenIndex !== undefined) {
    nodeCard.dataset.tokenIndex = node.tokenIndex;
  }

  // Contenido del nodo
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

  // Ajustar el tamaño del SVG al del contenedor del árbol
  const w = treeContainer.offsetWidth;
  const h = treeContainer.offsetHeight;
  connectionsSvg.setAttribute("width", w);
  connectionsSvg.setAttribute("height", h);
  connectionsSvg.style.width = `${w}px`;
  connectionsSvg.style.height = `${h}px`;

  // Limpiar paths existentes
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
 * Resaltado interactivo de camino (ancestros y descendientes)
 */
function handleNodeHover(nodeId, isHovered) {
  // Resaltar u ocultar nodo actual
  const node = nodeRegistry.get(nodeId);
  if (!node) return;

  // Resaltar camino hacia la raíz (ancestros)
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

  // Resaltar token correspondiente en la barra de expresión
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
 * Bucle de animación suave 3D y renderizado continuo
 */
function render3DLoop() {
  if (state.autoRotate) {
    state.autoRotateAngle += 0.008;
    state.targetRotY = Math.sin(state.autoRotateAngle) * 18;
    state.targetRotX = 10 + Math.cos(state.autoRotateAngle * 0.8) * 8;
  }

  // Suavizado e interpolación de rotación (lerp)
  state.rotX += (state.targetRotX - state.rotX) * 0.08;
  state.rotY += (state.targetRotY - state.rotY) * 0.08;

  // Sutil balanceo en el eje Z y Y para dar sensación de flotación continua
  const floatY = Math.sin(Date.now() * 0.0018) * 6;

  // Aplicar transformación 3D al mundo
  world3D.style.transform = `
    translate(${state.panX}px, ${state.panY + floatY}px)
    scale(${state.zoom})
    rotateX(${state.rotX.toFixed(2)}deg)
    rotateY(${state.rotY.toFixed(2)}deg)
  `;

  // Actualizar indicadores numéricos en HUD
  if (rotXValue) rotXValue.textContent = `${state.rotX.toFixed(1)}°`;
  if (rotYValue) rotYValue.textContent = `${state.rotY.toFixed(1)}°`;
  if (zoomValue) zoomValue.textContent = `${Math.round(state.zoom * 100)}%`;

  requestAnimationFrame(render3DLoop);
}

/**
 * Eventos del ratón para interactividad 3D
 */
function setupInteractions() {
  // Movimiento del cursor para perspectiva dinámica
  window.addEventListener("mousemove", (e) => {
    if (state.isDragging) {
      // Arrastrar para rotar / mover
      const deltaX = e.clientX - state.lastMouseX;
      const deltaY = e.clientY - state.lastMouseY;
      
      if (e.buttons === 1) { // Click izquierdo para rotar
        state.targetRotY += deltaX * 0.25;
        state.targetRotX -= deltaY * 0.25;
        // Limitar rotación en X
        state.targetRotX = Math.max(-45, Math.min(45, state.targetRotX));
      } else if (e.buttons === 2 || e.shiftKey) { // Click derecho o shift para desplazar (pan)
        state.panX += deltaX;
        state.panY += deltaY;
      }

      state.lastMouseX = e.clientX;
      state.lastMouseY = e.clientY;
    } else if (!state.autoRotate) {
      // Efecto de inclinación 3D dependiente de la posición del ratón
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const normX = (e.clientX - cx) / cx;
      const normY = (e.clientY - cy) / cy;

      // Calcular rotación objetivo
      state.targetRotY = normX * 18;
      state.targetRotX = -normY * 16 + 8;
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

  // Prevenir menú contextual al arrastrar con botón derecho
  sceneContainer.addEventListener("contextmenu", (e) => e.preventDefault());

  // Zoom con la rueda del ratón
  sceneContainer.addEventListener("wheel", (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    state.zoom = Math.min(Math.max(0.4, state.zoom * zoomFactor), 2.2);
    updateConnections();
  }, { passive: false });

  // Botón modo órbita / auto rotación
  if (btnAutoRotate) {
    btnAutoRotate.addEventListener("click", () => {
      state.autoRotate = !state.autoRotate;
      btnAutoRotate.classList.toggle("active", state.autoRotate);
    });
  }

  // Botón reiniciar vista
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      state.targetRotX = 12;
      state.targetRotY = -8;
      state.zoom = 1;
      state.panX = 0;
      state.panY = 0;
      state.autoRotate = false;
      if (btnAutoRotate) btnAutoRotate.classList.remove("active");
      setTimeout(updateConnections, 150);
    });
  }

  // Botón repetir animación de entrada
  if (btnReplay) {
    btnReplay.addEventListener("click", () => {
      nodeRegistry.forEach(node => {
        node.element.classList.remove("animate-entrance");
        void node.element.offsetWidth; // Forzar reflow
        node.element.classList.add("animate-entrance");
      });
      setTimeout(updateConnections, 400);
    });
  }

  // Botón mostrar/ocultar gramática
  if (btnGrammar && grammarDrawer) {
    btnGrammar.addEventListener("click", () => {
      grammarDrawer.classList.toggle("collapsed");
      btnGrammar.classList.toggle("active");
    });
  }

  // Recalcular conexiones al cambiar el tamaño de ventana
  window.addEventListener("resize", () => {
    setTimeout(updateConnections, 100);
  });
}

/**
 * Inicialización
 */
function init() {
  // Construir jerarquía visual
  treeContainer.innerHTML = "";
  const treeRoot = createTreeNodeElement(treeData);
  treeContainer.appendChild(treeRoot);

  // Inicializar interacciones y loop 3D
  setupInteractions();
  requestAnimationFrame(render3DLoop);

  // Trazar conexiones SVG una vez renderizado
  setTimeout(() => {
    updateConnections();
  }, 100);

  // Segunda pasada para asegurar dimensiones estables después de las animaciones iniciales
  setTimeout(() => {
    updateConnections();
  }, 700);
}

// Iniciar al cargar el documento
document.addEventListener("DOMContentLoaded", init);
