# simulador-automatas

**Universidad Mariano Galvez de Guatemala**  
**Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computacion**  
**Curso:** Automatas y Lenguajes Formales — Segundo Semestre 2026  
**Catedratico:** Ing. Emanuel Mazariegos  


# Descripcion
Simulador de automatas AFN y AFD con soporte para expresiones regulares. Proyecto final del curso Autómatas y Lenguajes Formales – UMG 2026. Incluye simulación de cadenas, conversión, minimización y validación mediante regex.



# Integrantes del proyecto

**Darwin Danilo Castro Garcia** - [GitHub](https://github.com/Darwin-code000)
*** Carné: 0903-20-6780


**Froilan Aldair Ardeano Miranda** - [GitHub](https://github.com/ardeanomiranda100597-lgtm)
*** Carné: 0903-23-3982

**Norberto Pedro Chún González** - [GitHub](https://github.com/pedrochun0779-tech)
*** Carné: 0903-24-5288

**Fernando José Batz Marroquín** - [GitHub](https://github.com/Fern0203)
*** Carné: 0903-23-463




## Guía de Instalación y Puesta en Marcha

### Prerrequisitos
* **Python 3.10 o superior** instalado y añadido al ' PATH ' del sistema.
* **Git** instalado.
* Navegador web moderno (Google Chrome, Microsoft Edge, Firefox).


# Resumen Instalacion

# En Windows

# powershell
# 1. Clonar y entrar al proyecto
git clone https://github.com/Fern0203/simulador-automatas.git
cd simulador-automatas

# 2. Configurar entorno virtual e instalar dependencias
python -m venv venv
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Levantar backend
python -m uvicorn backend.app:app --reload

# 4. Abrir el Frontend
Puede hacerlo en un editor como Visual Studio Code con la extension Liver Server, abriendo el archivo index.html en el navegador. O abre el explorador de archivos y haz doble clic sobre frontend/index.html

# cmd 
# Clonar el repositorio y entrar a la carpeta
git clone https://github.com/Fern0203/simulador-automatas.git
cd simulador-automatas

# 2. Crear el entorno virtual
python -m venv venv

# Activar el entorno virtual 
venv\Scripts\activate.bat

# Instalar las dependencias
pip install -r requirements.txt

# Iniciar el servidor backend (FastAPI)
python -m uvicorn backend.app:app --reload

# Abrir Frontend
arhivo index.html


# En mac ----
# 1. Clonar el repositorio y entrar a la carpeta
git clone https://github.com/Fern0203/simulador-automatas.git
cd simulador-automatas

# 2. Crear el entorno virtual (en Mac se utiliza python3)
python3 -m venv venv

# 3. Activar el entorno virtual
source venv/bin/activate

# 4. Instalar las dependencias
pip install -r requirements.txt

# 5. Iniciar el servidor backend (FastAPI)
python3 -m uvicorn backend.app:app --reload

# 6. Abrir Fronted