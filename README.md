# simulador-automatas

**Universidad Mariano Gálvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación**  
**Curso:** Autómatas y Lenguajes Formales — Segundo Semestre 2026  
**Catedrático:** M.A. Ing. Emanuel Mazariegos  


# Descripción

Simulador de autómatas AFN y AFD con soporte para expresiones regulares. Proyecto final del curso Autómatas y Lenguajes Formales – UMG 2026.

Es una plataforma web educativa e interactiva que modela, simula y transforma estructuras formales de la teoría de la computación. Con la aplicación se pueden crear autómatas en una tabla de transiciones, ver su grafo dibujado automáticamente y probar cadenas paso a paso. El sistema resuelve el ciclo completo de procesamiento de lenguajes regulares:

* **Definición y simulación:** representación matricial y gráfica de Autómatas Finitos Deterministas (AFD) y No Deterministas (AFN).
* **Transformación formal:** conversión de no determinismo a determinismo con el algoritmo de construcción de subconjuntos.
* **Optimización estructural:** minimización de estados equivalentes con el algoritmo de partición de Moore / Hopcroft.
* **Traducción expresión a grafo:** compilación de expresiones regulares a AFN con el algoritmo Shunting-yard y la construcción de Thompson.
* **Aplicación práctica:** auditoría léxica y sintáctica de archivos de registro (logs) contrastados contra expresiones regulares y diccionarios de símbolos.

El proyecto tiene dos partes que se comunican entre sí: un **backend** en Python (FastAPI) que hace los cálculos y un **frontend** en HTML, Tailwind CSS y JavaScript que muestra todo en el navegador. La librería para dibujar los grafos (Vis-Network) y los estilos ya generados (`output.css`) están guardados dentro del proyecto, así que la aplicación funciona sin internet.


# Integrantes del proyecto

**Darwin Danilo Castro García** - [GitHub](https://github.com/Darwin-code000)  
Carné: 0903-20-6780  
Rol: Backend lead y arquitectura de la API (contratos Pydantic, routers `rutas_regex.py` y `rutas_logs.py`, procesamiento de archivos multilínea y métricas de auditoría)

**Froilán Aldair Ardeano Miranda** - [GitHub](https://github.com/ardeanomiranda100597-lgtm)  
Carné: 0903-23-3982  
Rol: Algoritmos teóricos (Shunting-yard, construcción de Thompson en `regex_thompson.py`, subconjuntos, minimización de Moore y motor léxico de logs en `validador_logs.py`)

**Norberto Pedro Chún González** - [GitHub](https://github.com/pedrochun0779-tech)  
Carné: 0903-24-5288  
Rol: Visualización de grafos e integración (render de autómatas con Vis-Network, animación de cadenas, pipeline Regex → AFN → AFD y filtros reactivos)

**Fernando José Batz Marroquín** - [GitHub](https://github.com/Fern0203)  
Carné: 0903-23-463  
Rol: Frontend y UI/UX (maquetación de la SPA, diseño de la interfaz, tarjetas de métricas, dashboard de logs y prevención de ingresos inválidos en las matrices)


# Arquitectura del sistema

El sistema usa un desacoplamiento entre cliente y servidor con el patrón **SPA (Single Page Application) + API REST asíncrona**.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAPA CLIENTE (FRONTEND SPA)                        │
│                    HTML5 Semántico + Tailwind CSS 3 + Vanilla JS (ES6+)     │
│                                                                             │
│   ┌───────────────────────────┐         ┌───────────────────────────────┐   │
│   │          app.js           │         │           grafo.js            │   │
│   │  • Enrutamiento interno   │         │  • Motor Vis-Network (local)  │   │
│   │  • Generación de matrices │◄───────►│  • Modelo físico Force-Atlas2 │   │
│   │  • Validaciones léxicas   │         │  • Animación de cadenas       │   │
│   │  • Filtros dinámicos DOM  │         │  • Sanitización de identif.   │   │
│   └─────────────┬─────────────┘         └───────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────────────────────────┘
                  │
                  │ Peticiones HTTP asíncronas (JSON / Multipart Form-Data)
                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CAPA SERVIDOR (BACKEND REST API)                     │
│               Python 3.10+ / FastAPI / Uvicorn / Pydantic / re              │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │         backend/app.py (instancia FastAPI + middleware CORS)        │   │
│   └──────┬──────────────────────┬──────────────────────┬────────────────┘   │
│          ▼                      ▼                      ▼                    │
│   ┌───────────────┐      ┌───────────────┐      ┌───────────────────────┐   │
│   │   Enrutador   │      │  rutas_regex  │      │      rutas_logs       │   │
│   │  tradicional  │      │  (APIRouter)  │      │      (APIRouter)      │   │
│   └──┬────┬────┬──┘      └───────┬───────┘      └───────────┬───────────┘   │
│      │    │    │                 │                          │               │
│      ▼    ▼    ▼                 ▼                          ▼               │
│   ┌────┐┌────┐┌────┐     ┌───────────────┐      ┌───────────────────────┐   │
│   │Sim.││Con.││Min.│     │regex_thompson │      │    validador_logs     │   │
│   │.py ││.py ││.py │     │• Shunting-yard│      │• Parser con grupos    │   │
│   │    ││    ││    │     │• Thompson AFN │      │• Validador léxico     │   │
│   └────┘└────┘└────┘     └───────────────┘      └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Decisiones de diseño técnico

* **FastAPI con Pydantic:** toda petición entrante se valida con esquemas de Pydantic antes de llegar a la lógica matemática. Si los datos no cumplen la estructura esperada, el framework detiene la petición con un código 422 (Unprocessable Entity) o 400 (Bad Request), lo que protege al servidor de fallas no controladas.
* **Procesamiento multipart híbrido:** el módulo de logs usa `python-multipart`, así que el endpoint `/api/logs/analizar` acepta tanto archivos binarios (`.log`, `.txt`) como bloques de texto pegados en un área de texto.
* **Motor gráfico autónomo y 100% offline:** Vis-Network está guardado localmente en `frontend/js/vis-network.min.js`. La aplicación no depende de CDNs externas, así que el cálculo de fuerzas, el trazado de aristas dirigidas y las animaciones funcionan sin internet.
* **Estructura modular por routers (`APIRouter`):** la lógica está separada por responsabilidad (`rutas_regex.py`, `rutas_logs.py`, `regex_thompson.py`, `validador_logs.py`, `simulacion.py`, `conversion.py` y `minimizacion.py`) en lugar de concentrarse en un solo archivo.


# Módulos implementados

La aplicación tiene cinco módulos, cada uno en su propia pestaña.

## Módulo 1: Creación y simulación de autómatas (AFD / AFN)

Permite definir manualmente la 5-tupla formal de un autómata finito:

$$M = (Q, \Sigma, q_0, F, \delta)$$

Dibuja la estructura en un grafo dinámico y ejecuta la simulación paso a paso de una cadena, indicando el camino recorrido.

```text
Cadena ingresada: "101"
q0 ──(1)──► q1 ──(0)──► q0 ──(1)──► q1  ==>  ESTADO FINAL: q1 ∈ F  ==>  ACEPTADA
[Nodo amarillo]     [Nodo amarillo]     [Nodo verde]
```

**Funcionamiento algorítmico**

* **Modo AFD:** ejecuta la transición determinista $\delta(q, a) = p$. Por cada símbolo de la cadena evalúa un único destino.
* **Modo AFN:** maneja transiciones hacia conjuntos de estados $\delta(q, a) = \{p_1, p_2, \dots\}$. Antes de consumir cada carácter y justo después, calcula la ε-clausura mediante una búsqueda en anchura (BFS) o en profundidad (DFS) con control de ciclos, para evitar bucles infinitos.
* **Criterio de aceptación:** al terminar la lectura, el conjunto de estados activos $S_{\text{activos}}$ se compara con el conjunto de estados de aceptación $F$. La cadena es aceptada si

$$S_{\text{activos}} \cap F \neq \emptyset$$

**Contrato de datos (POST `/api/simular`)**

```json
{
  "tipo": "AFD",
  "estados": ["q0", "q1"],
  "alfabeto": ["0", "1"],
  "estado_inicial": "q0",
  "estados_aceptacion": ["q1"],
  "transiciones": {
    "q0": {"0": ["q0"], "1": ["q1"]},
    "q1": {"0": ["q0"], "1": ["q1"]}
  },
  "cadena": "101"
}
```

La respuesta indica si la cadena fue aceptada (`true` / `false`), un mensaje de diagnóstico y el vector secuencial de estados recorridos, que se usa para la animación.

## Módulo 2: Conversión de AFN a AFD (construcción de subconjuntos)

Transforma un AFN, con bifurcaciones o saltos ε, en un AFD formalmente equivalente que reconoce el mismo lenguaje regular.

```text
AFN (con bifurcaciones o saltos ε)
   │
   ▼
┌───────────────────────────────────────────────┐
│ Algoritmo de construcción de subconjuntos     │
│  1. S0 = ε-clausura(q0)                       │
│  2. Mover(T, a) para cada símbolo de Σ        │
│  3. U = ε-clausura(Mover(T, a))               │
│  4. Identificación de nuevos macroestados     │
└───────────────────────────────────────────────┘
   │
   ▼
AFD equivalente (sin ε, transiciones deterministas)
```

**Funcionamiento algorítmico**

* **Macroestado inicial:** $S_0 = \epsilon\text{-clausura}(q_0)$.
* **Exploración de transiciones:** para cada macroestado $T$ y cada símbolo $a \in \Sigma$ se calcula

$$U = \epsilon\text{-clausura}\left(\bigcup_{t \in T} \delta(t, a)\right)$$

  Si $U \neq \emptyset$ y no se había analizado antes, se agrega a la cola de estados deterministas.
* **Estados de aceptación:** un macroestado es final si contiene al menos un estado final del AFN original:

$$F_{\text{AFD}} = \{T \subseteq Q \mid T \cap F_{\text{AFN}} \neq \emptyset\}$$

**Salida:** genera la 5-tupla determinista para el canvas y una ventana modal con la tabla formal de subconjuntos, que documenta la relación entre las etiquetas del AFN y los nuevos macroestados.

## Módulo 3: Minimización de AFD (algoritmo de Moore / Hopcroft)

Elimina la redundancia estructural fusionando los estados que no se distinguen ante ninguna cadena futura. El resultado es el autómata con menor número de estados que conserva el lenguaje.

```text
Partición inicial P0:
  Grupo 1 (no finales): {A, B}
  Grupo 2 (finales):    {C, D}

Refinamiento evaluando transiciones con 0 y 1:
  P1 = { {A}, {B}, {C, D} }
  P2 = { {A}, {B}, {C, D} }  <-- estabilizado (P2 = P1)

Resultado: se fusionan los estados C y D en un solo nodo {C, D}.
```

**Funcionamiento algorítmico**

* **Partición inicial:** $P_0 = \{F, \; Q \setminus F\}$.
* **Refinamiento:** en cada iteración $k$, dos estados $p$ y $q$ siguen en el mismo bloque solo si están en el mismo bloque de $P_{k-1}$ y, para todo símbolo $a \in \Sigma$, $\delta(p, a)$ y $\delta(q, a)$ caen en un mismo bloque de $P_{k-1}$.
* **Criterio de parada:** el proceso termina cuando una ronda no genera subdivisiones, es decir, $P_{k+1} = P_k$.
* **Fusión de nodos:** cada bloque resultante se convierte en un nodo del AFD mínimo, y las transiciones se heredan de los representantes de cada grupo.

## Módulo 4: Expresiones regulares a AFN (Thompson y Shunting-yard)

Convierte una expresión regular infija, como `(a|b)*abb`, en un AFN con transiciones vacías (ε), y lo conecta con el módulo de conversión a AFD.

```text
Expresión regular: (a|b)*abb
   │
   ▼ (inserción de concatenación explícita)
   (a|b)*.a.b.b
   │
   ▼ (Shunting-yard con pila de operadores)
Postfijo:  ab|*a.b.b.
   │
   ▼ (construcción de Thompson con pila de fragmentos)
Grafo AFN: q0 ──ε──► q1 ... ──a──► ... ──b──► q10 (aceptación)
```

**Componentes del motor (`regex_thompson.py`)**

* **Inserción de concatenación explícita:** inserta el operador `.` entre parejas de caracteres adyacentes cuando un símbolo o una cerradura va seguido de otro símbolo o de un paréntesis de apertura.
* **Parser Shunting-yard (infijo a postfijo):** usa una pila para resolver la precedencia de operadores, de mayor a menor: unarios (`*`, `+`, `?`), concatenación (`.`) y unión (`|`). Respeta la jerarquía de paréntesis.
* **Construcción de Thompson:** evalúa la expresión postfija con una pila de fragmentos, cada uno con un estado inicial y un estado final:
  * **Símbolo base:** crea dos nodos y una arista con el carácter.
  * **Concatenación ($A \cdot B$):** une el estado final de $A$ con el inicial de $B$ mediante ε.
  * **Unión ($A \mid B$):** crea un nodo inicial que se bifurca hacia $A$ y $B$ con ε, y une sus salidas en un nuevo estado de aceptación.
  * **Cerradura de Kleene ($A^*$):** agrega un nuevo estado inicial y final con saltos ε directos y un lazo de retorno.
  * **Cerradura positiva ($A^+$) y opcional ($A?$):** se derivan con saltos ε controlados.

**Pipeline hacia la conversión:** el frontend toma el AFN generado por Thompson y lo carga en los campos del Módulo 2, lo que permite completar el flujo:

$$\text{Regex} \longrightarrow \text{AFN} \longrightarrow \text{AFD} \longrightarrow \text{AFD mínimo}$$

## Módulo 5: Análisis y auditoría léxica de logs

Aplica la teoría de lenguajes regulares para auditar la integridad sintáctica y léxica de archivos de registro generados por servidores web, bases de datos o sistemas operativos.

```text
Entrada: línea de log
   │
   ├─► 1. Evaluación de gramática regular (regex)
   │     ¿Cumple la estructura del patrón?
   │     NO  ──► Estado: ERROR_FORMATO (∉ L)
   │     SÍ
   │      │
   │      ▼
   └─► 2. Análisis léxico (diccionario de símbolos)
         ¿El token capturado (nivel / método) pertenece al diccionario?
         NO  ──► Estado: FUERA_DICCIONARIO
         SÍ  ──► Estado: VÁLIDA (∈ L)
```

**Clasificación formal de estados**

* **Válida ($w \in L$):** la línea respeta la estructura de la expresión regular y todos sus tokens clave están en el diccionario.
* **Fuera de diccionario:** la línea cumple la expresión regular, pero contiene una palabra que no está en el vocabulario autorizado. Por ejemplo, el nivel `CRITICAL` cuando el diccionario solo acepta `INFO`, `WARN` y `ERROR`.
* **Error de sintaxis o formato ($w \notin L$):** la línea no tiene la estructura requerida (faltan delimitadores, el orden cambió o hay símbolos inválidos) y se rechaza directamente.

**Características técnicas**

* **Plantillas preconfiguradas:** Log de Servidor Estándar, Servidor Apache y Eventos ISO. También permite una expresión regular totalmente personalizada.
* **Grupos de captura nombrados:** expresiones como `(?P<ip>\d{1,3}(?:\.\d{1,3}){3})` permiten extraer componentes léxicos (nivel, fecha, IP, método, mensaje).
* **Dashboard y filtros reactivos:** la interfaz muestra tarjetas con el conteo global y una tabla con insignias de color. Los registros se filtran (Todos, Válidas, Fuera de Diccionario, Errores Sintácticos) sin hacer nuevas peticiones al servidor.


# Catálogo de validaciones

* **Restricción de ε en AFD:** en modo determinista, el validador bloquea el uso de `ε`, `epsilon` o `λ` dentro del alfabeto.
* **Determinismo estricto:** la interfaz impide registrar más de un estado destino por celda en la matriz de un AFD, así que no se aceptan destinos separados por comas.
* **Integridad referencial de estados (Q):** al procesar matrices de transición, el backend y el frontend comprueban que todos los estados destino existan en el conjunto de estados declarado.
* **Validación léxica de cadenas:** antes de simular, el cliente revisa la cadena carácter por carácter y bloquea el envío si encuentra un símbolo fuera del alfabeto Σ.
* **Control de ciclos en saltos ε:** durante el cálculo de ε-clausuras, el sistema guarda los elementos visitados para evitar ciclos recursivos o desbordamientos de pila (Stack Overflow).
* **Manejo seguro de archivos multipart:** el endpoint de logs valida la extensión del archivo, decodifica el flujo de bytes en UTF-8 con reemplazo de caracteres corruptos y reporta errores específicos cuando la carga está vacía.


# Guía de instalación y puesta en marcha

## Prerrequisitos

* **Python 3.10 o superior**, instalado y agregado al `PATH` del sistema.
* **Git** instalado.
* Navegador web moderno (Google Chrome, Microsoft Edge o Firefox).
* **Node.js 20 o superior** (versión LTS, incluye `npm`). Solo hace falta para modificar el diseño del frontend; para usar la aplicación no es necesario. Ver [Modificar el diseño (Tailwind CSS)](#modificar-el-diseño-tailwind-css).

## Instalación en Windows (PowerShell)

```powershell
# 1. Clonar y entrar al proyecto
git clone https://github.com/Fern0203/simulador-automatas.git
cd simulador-automatas

# 2. Crear el entorno virtual e instalar dependencias
python -m venv venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Levantar el backend
python -m uvicorn backend.app:app --reload
```

El comando `Set-ExecutionPolicy` solo hace falta si PowerShell bloquea la activación del entorno (error `PSSecurityException`). Solo afecta a la ventana que tienes abierta.

Usamos `python -m uvicorn` en lugar de `uvicorn` directo porque en algunos equipos con Windows las políticas de seguridad bloquean los archivos `.exe` del entorno virtual.

## Instalación en Windows (CMD)

```bat
:: 1. Clonar y entrar al proyecto
git clone https://github.com/Fern0203/simulador-automatas.git
cd simulador-automatas

:: 2. Crear y activar el entorno virtual
python -m venv venv
venv\Scripts\activate.bat

:: 3. Instalar dependencias
pip install -r requirements.txt

:: 4. Levantar el backend
python -m uvicorn backend.app:app --reload
```

## Instalación en Mac / Linux

```bash
# 1. Clonar y entrar al proyecto
git clone https://github.com/Fern0203/simulador-automatas.git
cd simulador-automatas

# 2. Crear el entorno virtual (en Mac se usa python3)
python3 -m venv venv

# 3. Activar el entorno virtual
source venv/bin/activate

# 4. Instalar dependencias
pip install -r requirements.txt

# 5. Levantar el backend
python3 -m uvicorn backend.app:app --reload
```

## Abrir el frontend

Con el backend corriendo (deja esa terminal abierta), abre la interfaz de cualquiera de estas formas:

* En **Visual Studio Code**, con la extensión *Live Server*: clic derecho sobre `frontend/index.html` y elegir *Open with Live Server*. Normalmente abre en el puerto 5500.
* Desde el **explorador de archivos**: entra a la carpeta `frontend/` y haz doble clic en `index.html`.
* En **Mac**: `open frontend/index.html`

Cuando el backend está activo, la API queda en http://127.0.0.1:8000 y su documentación interactiva (Swagger) en http://127.0.0.1:8000/docs.

No hace falta instalar Node.js para abrir el frontend: los estilos ya están generados en `frontend/css/output.css`.


# Modificar el diseño (Tailwind CSS)

El frontend usa **Tailwind CSS 3**, instalado con npm dentro de la carpeta `frontend/`. La página no carga Tailwind desde internet: carga `frontend/css/output.css`, un archivo que Tailwind genera a partir de:

* `frontend/css/input.css`: los estilos propios del proyecto. Aquí se escribe el CSS nuevo, incluido `@apply`.
* `frontend/tailwind.config.js`: colores, fuentes y modo oscuro.
* Las clases de Tailwind que aparecen en `index.html`, `js/app.js` y `js/grafo.js`.

Si solo vas a usar el simulador, puedes saltarte esta sección.

## Primera vez (después de clonar)

Con Node.js instalado, desde la carpeta principal del proyecto:

```bash
cd frontend
npm install
```

`npm install` lee `package.json` y `package-lock.json` e instala la misma versión de Tailwind que usa el resto del equipo. Crea la carpeta `node_modules/`, que no se sube a Git.

Para comprobarlo, `npm ls tailwindcss` debe mostrar `tailwindcss@3.4.19`.

## Mientras trabajas en el diseño

Desde `frontend/`, deja corriendo este comando en una terminal aparte (el backend va en otra):

```bash
npx tailwindcss -i ./css/input.css -o ./css/output.css --watch
```

Cada vez que guardas `index.html`, `input.css`, `tailwind.config.js`, `app.js` o `grafo.js`, Tailwind vuelve a generar `output.css` y en la terminal aparece `Rebuilding... Done`. Para detenerlo, presiona `Ctrl + C`.

Cuando hagas commit, sube también `css/output.css`: así la página se ve bien para quien no tenga Node.js.

## Reglas para no romper nada

* No edites `css/output.css` a mano: se sobrescribe cada vez que corre el comando. Los estilos propios van en `css/input.css`.
* No ejecutes `npm install tailwindcss` ni `npm audit fix --force`: los dos instalan Tailwind 4, que se configura distinto y cambia el tamaño de varias clases del diseño.
* No cambies los `id`, los atributos `data-vista` ni las clases que usa `app.js`. Están listadas en el comentario del inicio de `index.html`.
* Si al hacer merge hay un conflicto en `css/output.css`, no lo resuelvas a mano: acepta cualquiera de las dos versiones y vuelve a correr el comando.

## Problemas comunes

* **La página se ve sin estilos.** Falta `css/output.css`. Desde `frontend/`, genéralo una vez con `npx tailwindcss -i ./css/input.css -o ./css/output.css`.
* **npm muestra "vulnerabilities" al instalar.** Son avisos de herramientas que solo corren en tu computadora para generar el CSS; nada de eso llega a la página. Se pueden ignorar.
* **Aparece "Browserslist: caniuse-lite is outdated".** Es solo un aviso y no afecta el resultado.
* **PowerShell no deja ejecutar `npm` o `npx`** (error de que la ejecución de scripts está deshabilitada). Usa la terminal CMD, o ejecuta antes `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` en esa ventana.
* **La terminal es WSL y el proyecto está en el disco de Windows (C:).** Agrega `--poll` al final del comando; sin eso, Tailwind no detecta los cambios que guardas desde VS Code.
* **VS Code marca "Unknown at rule @apply" o "@tailwind" en `input.css`.** Son avisos del editor, no errores. Para ocultarlos: `Ctrl + ,`, busca *unknown at rules* y elige *ignore*.
* **Una clase nueva no hace efecto.** Revisa que el comando con `--watch` siga corriendo en su terminal.


# Cómo usar el simulador

La aplicación tiene cinco módulos, cada uno en su propia pestaña. Estos ejemplos sirven para probarla rápido.

## 1. Simular un autómata (AFD)

Ejemplo: un AFD que acepta las cadenas que terminan en 1.

1. En la pestaña **Constructor & Simulación**, selecciona **AFD (Determinista)**.
2. En **Conjunto de Estados (Q)** escribe `q0, q1`.
3. En **Alfabeto de Entrada (Σ)** escribe `0, 1`.
4. Haz clic fuera del campo para que se actualicen los selectores.
5. Elige `q0` como estado inicial y marca `q1` como final.
6. Presiona **Generar Tabla de Transiciones (δ)** y llena la tabla:

| Estado | con 0 | con 1 |
|--------|-------|-------|
| q0     | q0    | q1    |
| q1     | q0    | q1    |

7. Presiona **Generar Autómata y Dibujar Grafo**. El grafo aparece en pantalla.
8. En **Cadena de entrada (w)** escribe `101` y presiona **Simular cadena**.

Durante la simulación los nodos se pintan de amarillo. Al terminar, el último estado queda en **verde** si la cadena se acepta o en **rojo** si se rechaza. Con `101` queda en verde y con `110` en rojo.

Para simular un **AFN**, elige **AFN (No Determinista)**. Se habilita la columna ε y se pueden escribir varios destinos separados por coma (por ejemplo `q0, q1`).

## 2. Convertir un AFN a AFD

Ejemplo: un AFN que acepta las cadenas que terminan en 01.

1. Ve a la pestaña **AFN → AFD**.
2. Estados: `q0, q1, q2`. Alfabeto: `0, 1`. Inicial: `q0`. Final: `q2`.
3. Presiona **Generar Matriz de Transiciones (AFN)** y llena la matriz:

| Estado | con 0  | con 1 | con ε   |
|--------|--------|-------|---------|
| q0     | q0, q1 | q0    | (vacío) |
| q1     | (vacío)| q2    | (vacío) |
| q2     | (vacío)| (vacío)| (vacío)|

4. Presiona **Convertir a AFD y Dibujar Grafo**.
5. Para ver el procedimiento, presiona **Ver Pasos de Subconjuntos**.

El AFD resultante tiene tres estados: `{q0}`, `{q0, q1}` y `{q0, q2}`. El último es final porque contiene a `q2`.

## 3. Minimizar un AFD

1. Ve a la pestaña **Minimización**.
2. Estados: `A, B, C, D`. Alfabeto: `0, 1`. Inicial: `A`. Finales: `C, D`.
3. Presiona **Generar Matriz de Transiciones (AFD)** y llena la matriz:

| Estado | con 0 | con 1 |
|--------|-------|-------|
| A      | B     | A     |
| B      | A     | C     |
| C      | C     | D     |
| D      | D     | C     |

4. Presiona **Minimizar AFD y Dibujar Grafo**.
5. Para ver cómo se llegó al resultado, abre **Ver Particiones del Algoritmo**.

El autómata pasa de 4 a 3 estados, porque `C` y `D` se comportan igual y se unen en `{C, D}`.

## 4. Expresión regular a AFN (Thompson)

1. Ve a la pestaña **Expresiones Regulares**.
2. Escribe la expresión `(a|b)*abb`. Se admiten los operadores `|`, `*`, `+` y `?`.
3. Presiona **⚡ Generar AFN (Thompson)** para ver los estados intermedios y las transiciones ε.
4. En el probador de cadenas, prueba `ababb` (aceptada) y `aba` (rechazada).
5. Presiona **🔄 Enviar este AFN a Conversión** para cargarlo en la pestaña **AFN → AFD** y convertirlo.

## 5. Analizador de logs

1. Ve a la pestaña **Analizador de Logs**.
2. Elige una plantilla, por ejemplo **Log de Servidor**, y define el diccionario de símbolos (por ejemplo `INFO, WARN, WARNING, ERROR`).
3. Pega el texto de los registros o sube un archivo `.log` / `.txt`.
4. Presiona **⚡ Auditar Registros**. El dashboard muestra el total de registros y cuántos son válidos, fuera de diccionario o errores de sintaxis.
5. Usa los botones **Válidas**, **Fuera Diccionario** y **Errores Sintácticos** para filtrar la tabla.

Por ejemplo, con estas tres líneas:

```text
[INFO] 2026-10-15 192.168.1.10 - Conexión establecida con éxito
[CRITICAL] 2026-10-15 10.0.0.5 - Falla crítica fuera de diccionario
2026-10-15 ERROR 192.168.1.50 Linea sin corchetes
```

La primera es válida, la segunda queda fuera de diccionario porque `CRITICAL` no está en la lista, y la tercera es un error de sintaxis porque no tiene corchetes.


# Endpoints de la API REST

La documentación interactiva de todos los endpoints está en http://127.0.0.1:8000/docs cuando el backend está activo.

| Método | Endpoint | Parámetros clave | Código de éxito | Función principal |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/simular` | JSON con la 5-tupla y la cadena a evaluar | 200 OK | Simula el recorrido de una cadena en un AFD o AFN. |
| `POST` | `/api/convertir` | JSON con la 5-tupla del AFN | 200 OK | Aplica construcción de subconjuntos y devuelve el AFD. |
| `POST` | `/api/minimizar` | JSON con la 5-tupla del AFD | 200 OK | Minimiza el AFD mediante particiones de Moore. |
| `POST` | `/api/regex/generar-afn` | `{"regex": "(a\|b)*abb"}` | 200 OK | Construye el AFN por Thompson compatible con el canvas. |
| `POST` | `/api/regex/validar-cadena` | `{"regex": "...", "cadena": "..."}` | 200 OK | Evalúa si una cadena coincide completamente con la regex. |
| `GET` | `/api/logs/patrones` | Ninguno | 200 OK | Devuelve las plantillas y diccionarios preconfigurados. |
| `POST` | `/api/logs/analizar` | Formulario multipart: archivo o texto, patrón, diccionario | 200 OK | Audita líneas de log y devuelve métricas y diagnósticos. |


# Estructura del repositorio

```text
simulador-automatas/
├── backend/
│   ├── app.py              # Punto de entrada, configuración de FastAPI y CORS
│   ├── rutas_regex.py      # Endpoints de generación de AFN y validación de expresiones
│   ├── regex_thompson.py   # Shunting-yard y construcción de Thompson
│   ├── rutas_logs.py       # Endpoints y esquemas para análisis de archivos de log
│   ├── validador_logs.py   # Motor de análisis sintáctico y validación de diccionarios
│   ├── simulacion.py       # Recorrido de cadenas y cálculo de ε-clausura
│   ├── conversion.py       # Construcción de subconjuntos (AFN a AFD)
│   └── minimizacion.py     # Partición de estados equivalentes (Moore)
├── frontend/
│   ├── css/
│   │   ├── input.css       # Estilos propios y directivas de Tailwind (aquí se edita)
│   │   └── output.css      # CSS generado por Tailwind (no editar a mano)
│   ├── img/                # Imágenes
│   ├── js/
│   │   ├── app.js          # DOM, matrices, validaciones, peticiones HTTP y filtros
│   │   ├── grafo.js        # Configuración y renderizado con Vis-Network
│   │   └── vis-network.min.js  # Motor gráfico offline
│   ├── node_modules/       # Lo crea npm install (no se sube a Git)
│   ├── index.html          # Interfaz SPA con navegación por pestañas
│   ├── tailwind.config.js  # Configuración de Tailwind (colores, fuentes y modo oscuro)
│   ├── package.json        # Dependencias del frontend (Tailwind CSS)
│   └── package-lock.json   # Versiones exactas de esas dependencias
├── requirements.txt        # Dependencias de Python (incluye python-multipart)
└── README.md               # Documentación oficial del repositorio
```