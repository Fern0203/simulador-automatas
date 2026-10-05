# simulador-automatas

**Universidad Mariano Gálvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación**  
**Curso:** Autómatas y Lenguajes Formales — Segundo Semestre 2026  
**Catedrático:** Ing. Emanuel Mazariegos  


# Descripción

Simulador de autómatas AFN y AFD con soporte para expresiones regulares. Proyecto final del curso Autómatas y Lenguajes Formales – UMG 2026.

Con la aplicación se pueden crear autómatas en una tabla de transiciones, ver su grafo dibujado automáticamente y probar cadenas paso a paso. También incluye la conversión de AFN a AFD, la minimización de AFD y la validación mediante regex.

El proyecto tiene dos partes que se comunican entre sí: un **backend** en Python (FastAPI) que hace los cálculos y un **frontend** en HTML, CSS y JavaScript que muestra todo en el navegador. La librería para dibujar los grafos (Vis-Network) está guardada dentro del proyecto, así que la aplicación funciona sin internet.


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


# Cómo usar el simulador

La aplicación tiene tres módulos, cada uno en su propia pestaña. Estos ejemplos sirven para probarla rápido.

## Simular un autómata (AFD)

Ejemplo: un AFD que acepta las cadenas que terminan en 1.

1. Selecciona el modo **AFD**.
2. En **Estados (Q)** escribe `q0, q1`.
3. En **Alfabeto (Σ)** escribe `0, 1`.
4. Haz clic fuera del campo para que se actualicen los selectores.
5. Elige `q0` como estado inicial y marca `q1` como final.
6. Presiona **Generar Matriz de Transiciones** y llena la tabla:

| Estado | con 0 | con 1 |
|--------|-------|-------|
| q0     | q0    | q1    |
| q1     | q0    | q1    |

7. Presiona **Guardar Autómata**. El grafo aparece en pantalla.
8. En **Probar Cadena** escribe `101` y presiona **Simular Cadena**.

Durante la simulación los nodos se pintan de amarillo. Al terminar, el último estado queda en **verde** si la cadena se acepta o en **rojo** si se rechaza. Con `101` queda en verde y con `110` en rojo.

Para simular un **AFN**, cambia el selector a AFN. Se habilita la columna ε y se pueden escribir varios destinos separados por coma (por ejemplo `q0, q1`).

## Convertir un AFN a AFD

Ejemplo: un AFN que acepta las cadenas que terminan en 01.

1. Ve a la pestaña **Conversión AFN a AFD**.
2. Estados: `q0, q1, q2`. Alfabeto: `0, 1`. Inicial: `q0`. Final: `q2`.
3. Llena la matriz:

| Estado | con 0  | con 1 | con ε   |
|--------|--------|-------|---------|
| q0     | q0, q1 | q0    | (vacío) |
| q1     | (vacío)| q2    | (vacío) |
| q2     | (vacío)| (vacío)| (vacío)|

4. Presiona **Convertir a AFD y Dibujar Grafo**.
5. Para ver el procedimiento, presiona **Ver Pasos de Subconjuntos**.

El AFD resultante tiene tres estados: `{q0}`, `{q0, q1}` y `{q0, q2}`. El último es final porque contiene a `q2`.

## Minimizar un AFD

1. Ve a la pestaña **Minimización de AFD**.
2. Estados: `A, B, C, D`. Alfabeto: `0, 1`. Inicial: `A`. Finales: `C, D`.
3. Llena la matriz:

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
│   │   └── estilos.css     # Estilos de la interfaz
│   ├── js/
│   │   ├── app.js          # DOM, matrices y validaciones
│   │   ├── grafo.js        # Dibujo de grafos
│   │   └── vis-network.min.js  # Librería de grafos (offline)
│   └── index.html          # Página principal
├── requirements.txt        # Dependencias de Python
└── README.md
```


