# simulador-automatas

**Universidad Mariano Gálvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación**  
**Curso:** Autómatas y Lenguajes Formales — Segundo Semestre 2026  
**Catedrático:** Ing. Emanuel Mazariegos  


# Descripción

Simulador de autómatas AFN y AFD con soporte para expresiones regulares. Proyecto final del curso Autómatas y Lenguajes Formales – UMG 2026.

Con la aplicación se pueden crear autómatas en una tabla de transiciones, ver su grafo dibujado automáticamente y probar cadenas paso a paso. También incluye la conversión de AFN a AFD, la minimización de AFD y la validación mediante regex.

El proyecto tiene dos partes que se comunican entre sí: un **backend** en Python (FastAPI) que hace los cálculos y un **frontend** en HTML, Tailwind CSS y JavaScript que muestra todo en el navegador. La librería para dibujar los grafos (Vis-Network) y los estilos ya generados (`output.css`) están guardados dentro del proyecto, así que la aplicación funciona sin internet.


# Integrantes del proyecto

**Darwin Danilo Castro García** - [GitHub](https://github.com/Darwin-code000)  
Carné: 0903-20-6780

**Froilán Aldair Ardeano Miranda** - [GitHub](https://github.com/ardeanomiranda100597-lgtm)  
Carné: 0903-23-3982

**Norberto Pedro Chún González** - [GitHub](https://github.com/pedrochun0779-tech)  
Carné: 0903-24-5288

**Fernando José Batz Marroquín** - [GitHub](https://github.com/Fern0203)  
Carné: 0903-23-463


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

* En **Visual Studio Code**, con la extensión *Live Server*: clic derecho sobre `frontend/index.html` y elegir *Open with Live Server*.
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

La aplicación tiene tres módulos, cada uno en su propia pestaña. Estos ejemplos sirven para probarla rápido.

## Simular un autómata (AFD)

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

## Convertir un AFN a AFD

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

## Minimizar un AFD

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


# Algoritmos implementados

**Simulación (`simulacion.py`)**  
En un AFD se sigue la transición δ(q, a) = p por cada símbolo. En un AFN se calcula la ε-clausura de los estados activos antes y después de leer cada símbolo. La cadena se acepta si al final queda algún estado final entre los activos.

**Conversión (`conversion.py`)**  
Usa el algoritmo de construcción de subconjuntos. Para cada macroestado T y símbolo a se calcula U = ε-clausura(mover(T, a)) y se agrega como estado nuevo si todavía no existía. Al final se genera la tabla de transiciones del AFD.

**Minimización (`minimizacion.py`)**  
Usa el método de particiones de Moore/Hopcroft. Se empieza con P0 separando estados finales y no finales, y se va refinando hasta que la partición ya no cambia (Pk+1 = Pk). Cada grupo resultante pasa a ser un estado del AFD mínimo.


# Estructura del repositorio

```text
simulador-automatas/
├── backend/
│   ├── app.py              # Rutas de FastAPI y CORS
│   ├── simulacion.py       # Recorrido de cadenas, ε-clausura y validación
│   ├── conversion.py       # Construcción de subconjuntos (AFN a AFD)
│   └── minimizacion.py     # Partición de estados equivalentes
├── frontend/
│   ├── css/
│   │   ├── input.css       # Estilos propios y directivas de Tailwind (aquí se edita)
│   │   └── output.css      # CSS generado por Tailwind (no editar a mano)
│   ├── img/                # Imágenes
│   ├── js/
│   │   ├── app.js          # DOM, matrices y validaciones
│   │   ├── grafo.js        # Dibujo de grafos
│   │   └── vis-network.min.js  # Librería de grafos (offline)
│   ├── node_modules/       # Lo crea npm install (no se sube a Git)
│   ├── index.html          # Página principal
│   ├── tailwind.config.js  # Configuración de Tailwind (colores, fuentes y modo oscuro)
│   ├── package.json        # Dependencias del frontend (Tailwind CSS)
│   └── package-lock.json   # Versiones exactas de esas dependencias
├── requirements.txt        # Dependencias de Python
└── README.md
```


