// Variables globales que usaremos en toda la aplicación
let currentPage = 1;
let allMovies = [];
let isSearching = false;
let request = false;
const API_KEY = 'cf12fd78';
const DEFAULT_IMAGE = './default.png';  // Ruta a la imagen por defecto

// Función que se ejecuta cuando la página termina de cargar
window.onload = function() {
    initialize();
};

// Configurar todos los eventos de la página
function initialize() {
    // Obtener referencias a los elementos que vamos a usar
    const searchInput = document.getElementById("input");
    const searchButton = document.getElementById("botonBuscar");
    const typeSelect = document.getElementById("tipo");
    const reportButton = document.getElementById("Ver-Informe");
    const closeModalButton = document.getElementById("cerrarModal");
    const closeReportButton = document.getElementById("cerrarInforme");

    // Evento para buscar cuando se escribe
    searchInput.addEventListener("input", function() {
        // Si el input está vacío, limpiar resultados
        if (this.value.length === 0) {
            clearResults();
            return;
        }
    });

    // Buscar cuando se presiona enter
    searchInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            startNewSearch();
        }
    });

    // Evento para el botón de búsqueda
    searchButton.addEventListener("click", startNewSearch);

    // Evento para cuando cambia el tipo de búsqueda (película/serie)
    typeSelect.addEventListener("change", function() {
        if (searchInput.value.length >= 3) {
            startNewSearch();
        }
    });

    // Evento para el botón de informe
    reportButton.addEventListener("click", () => {
        let activeType = document.querySelector('.tab-button.active').dataset.tipo;
        showReport(activeType);
    });

    // Eventos para los botones de las pestañas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const clickedButton = e.target.closest('.tab-button');
            if (!clickedButton) return;

            // Remover la clase active de todos los botones
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Añadir la clase active al botón clickeado
            clickedButton.classList.add('active');

            // Mostrar el informe del tipo seleccionado
            showReport(clickedButton.dataset.tipo);
        });
    });

    // Eventos para los botones de cerrar
    closeModalButton.addEventListener("click", closeWindows);
    closeReportButton.addEventListener("click", closeWindows);

    // Evento para cerrar ventanas con ESC
    window.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closeWindows();
        }
    });

    // Evento para el botón de buscar más al final de la página
    const loadMoreButton = document.querySelector(".load-more-button");
    loadMoreButton.addEventListener("click", makeOMDbRequest);
}

// Función para limpiar los resultados
function clearResults() {
    document.getElementById("listaPeliculas").innerHTML = "";
    document.getElementById("TotalResultados").innerText = "";
}

// Función para iniciar una nueva búsqueda
function startNewSearch() {
    clearResults();
    allMovies = [];
    currentPage = 1;
    searchMovies();
}

// Función principal de búsqueda
function searchMovies() {
    // Si ya está buscando, no hacer nada
    if (isSearching) return;

    // Marcar que está buscando
    isSearching = true;
    showLoading(true);

    // Obtener los valores de búsqueda
    const searchText = document.getElementById("input").value;
    const type = document.getElementById("tipo").value;

    // Crear la URL de búsqueda
    const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${searchText}&page=${currentPage}&type=${type}`;

    // Hacer la petición a la API
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.Response === "True") {
                // Mostrar el total de resultados
                document.getElementById("TotalResultados").innerText = `${data.totalResults} resultados`;
                
                // Buscar los detalles de cada película
                data.Search.forEach(movie => {
                    fetchMovieDetails(movie.imdbID);
                });

                // Aumentar el número de página
                currentPage++;
            } else {
                document.getElementById("TotalResultados").innerText = "No se encontraron resultados";
            }
        })
        .catch(error => {
            console.error("Error en la búsqueda:", error);
            document.getElementById("TotalResultados").innerText = "Error al buscar películas";
        })
        .finally(() => {
            isSearching = false;
            showLoading(false);
        });
}

// Función para buscar los detalles de una película
function fetchMovieDetails(id) {
    const url = `https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`;

    fetch(url)
        .then(response => response.json())
        .then(movie => {
            // Guardar la película en el array global
            allMovies.push(movie);
            // Mostrar la película en la página
            displayMovie(movie);
        })
        .catch(error => console.error("Error al buscar detalles:", error));
}

// Función para mostrar una película en la página
function displayMovie(movie) {
    const container = document.createElement("div");
    container.className = "pelicula";

    // Crear la imagen
    const image = document.createElement("img");
    image.src = movie.Poster !== "N/A" ? movie.Poster : DEFAULT_IMAGE;
    image.alt = movie.Title;
    image.onerror = () => image.src = DEFAULT_IMAGE;
    image.onclick = () => showDetails(movie);

    // Crear el título
    const title = document.createElement("p");
    title.textContent = `${movie.Title} (${movie.Year})`;

    // Añadir todo al contenedor
    container.appendChild(image);
    container.appendChild(title);

    // Añadir al listado de películas
    document.getElementById("listaPeliculas").appendChild(container);
}

// Función para mostrar los detalles de una película
function showDetails(movie) {
    // Actualizar la información básica en el modal
    document.getElementById("tituloPelicula").textContent = movie.Title;
    document.getElementById("anioPelicula").textContent = movie.Year;
    document.getElementById("directorPelicula").textContent = movie.Director;
    document.getElementById("actoresPelicula").textContent = movie.Actors;
    document.getElementById("sinopsisPelicula").textContent = movie.Plot;

    // Mostrar todas las valoraciones disponibles
    const ratingContainer = document.getElementById("Rating");
    ratingContainer.innerHTML = ''; // Limpiar contenedor de ratings

    // Mostrar valoración de IMDB
    if (movie.imdbRating && movie.imdbRating !== "N/A") {
        const imdbRating = document.createElement('div');
        imdbRating.className = 'rating-item';
        imdbRating.innerHTML = `<strong>IMDB:</strong> ${movie.imdbRating}/10`;
        ratingContainer.appendChild(imdbRating);
    }

    // Mostrar todas las valoraciones adicionales
    if (movie.Ratings && Array.isArray(movie.Ratings)) {
        movie.Ratings.forEach(rating => {
            if (rating.Source !== "Internet Movie Database") { // Evitar duplicar IMDB
                const ratingElement = document.createElement('div');
                ratingElement.className = 'rating-item';
                ratingElement.innerHTML = `<strong>${rating.Source}:</strong> ${rating.Value}`;
                ratingContainer.appendChild(ratingElement);
            }
        });
    }

    // Actualizar la imagen
    const image = document.getElementById("imagenPelicula");
    image.src = movie.Poster !== "N/A" ? movie.Poster : DEFAULT_IMAGE;
    image.alt = movie.Title;
    image.onerror = () => image.src = DEFAULT_IMAGE;

    // Mostrar el modal
    document.getElementById("modal").classList.add("mostrar");
}

// Función para mostrar el informe
function showReport(type) {
    const container = document.getElementById("contenidoInforme");
    
    if (allMovies.length === 0) {
        container.innerHTML = `
            <h3>No hay películas para mostrar</h3>
            <p>Realice una búsqueda primero para ver estadísticas.</p>
        `;
        document.getElementById("chart_div").style.display = "none";
        document.getElementById("informeDiv").style.display = "flex";
        return;
    }

    let sortedMovies = [];
    switch (type) {
        case 'rating':
            sortedMovies = allMovies
                .filter(movie => movie.imdbRating !== "N/A")
                .sort((a, b) => parseFloat(b.imdbRating) - parseFloat(a.imdbRating));
            break;
        case 'boxOffice':
            sortedMovies = allMovies
                .filter(movie => movie.BoxOffice && movie.BoxOffice !== "N/A")
                .sort((a, b) => {
                    const aValue = parseFloat(a.BoxOffice.replace(/[^0-9.]/g, '')) || 0;
                    const bValue = parseFloat(b.BoxOffice.replace(/[^0-9.]/g, '')) || 0;
                    return bValue - aValue;
                });

            // Formatear valores de taquilla para mostrar
            sortedMovies.forEach(movie => {
                if (movie.BoxOffice && movie.BoxOffice !== "N/A") {
                    const value = parseFloat(movie.BoxOffice.replace(/[^0-9.]/g, ''));
                    movie.BoxOffice = new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0
                    }).format(value);
                } else {
                    movie.BoxOffice = 'No disponible';
                }
            });
            break;
        case 'votes':
            sortedMovies = allMovies
                .filter(movie => movie.imdbVotes && movie.imdbVotes !== "N/A")
                .sort((a, b) => parseInt(b.imdbVotes.replace(/,/g, '')) - parseInt(a.imdbVotes.replace(/,/g, '')));
            break;
    }

    const top5Movies = sortedMovies.slice(0, 5);
    
    // Actualizar título según el tipo
    let title = '';
    switch (type) {
        case 'rating':
            title = 'Películas mejor valoradas';
            break;
        case 'boxOffice':
            title = 'Películas con mayor recaudación';
            break;
        case 'votes':
            title = 'Películas más votadas';
            break;
    }

    container.innerHTML = `<h3>Top 5 ${title}</h3>`;

    const list = document.createElement("div");
    list.className = "lista-peliculas-informe";

    top5Movies.forEach((movie, position) => {
        const element = document.createElement("div");
        element.className = "pelicula-informe";

        const rankingNumber = document.createElement("div");
        rankingNumber.className = "posicion";
        rankingNumber.textContent = position + 1;

        const info = document.createElement("div");
        info.className = "info-pelicula-informe";
        
        let displayedValue = '';
        switch (type) {
            case 'rating':
                displayedValue = `Valoración: ${movie.imdbRating}/10`;
                break;
            case 'boxOffice':
                displayedValue = `Taquilla: ${movie.BoxOffice}`;
                break;
            case 'votes':
                displayedValue = `Votos: ${movie.imdbVotes}`;
                break;
        }

        info.innerHTML = `
            <h4>${movie.Title}</h4>
            <p>${displayedValue}</p>
        `;

        element.appendChild(rankingNumber);
        element.appendChild(info);
        list.appendChild(element);
    });

    container.appendChild(list);
    createChart(top5Movies, type);
    document.getElementById("informeDiv").style.display = "flex";
}

// Función para crear el gráfico
function createChart(movies, type) {
    google.charts.load('current', { packages: ['corechart'] });
    google.charts.setOnLoadCallback(() => {
        const data = new google.visualization.DataTable();
        data.addColumn('string', 'Película');
        
        let columnY = '';
        switch (type) {
            case 'rating':
                columnY = 'Valoración';
                break;
            case 'boxOffice':
                columnY = 'Taquilla ($)';
                break;
            case 'votes':
                columnY = 'Número de votos';
                break;
        }
        data.addColumn('number', columnY);

        movies.forEach(movie => {
            let value = 0;
            switch (type) {
                case 'rating':
                    value = parseFloat(movie.imdbRating);
                    break;
                case 'boxOffice':
                    value = parseFloat(movie.BoxOffice.replace(/[^0-9.]/g, ''));
                    break;
                case 'votes':
                    value = parseInt(movie.imdbVotes.replace(/,/g, ''));
                    break;
            }
            data.addRow([movie.Title, value]);
        });

        const options = {
            title: `Top 5 ${columnY}`,
            backgroundColor: { fill: 'transparent' },
            titleTextStyle: { color: '#fff', fontSize: 18, bold: true },
            legend: { position: 'none' },
            hAxis: {
                textStyle: { color: '#fff' },
                gridlines: { color: '#333' }
            },
            vAxis: {
                textStyle: { color: '#fff' },
                gridlines: { color: '#333' }
            },
            chartArea: { width: '80%', height: '70%' },
            colors: ['#3498db'],
            animation: {
                startup: true,
                duration: 1000,
                easing: 'out'
            },
            bar: { groupWidth: '70%' }
        };

        document.getElementById('chart_div').style.display = 'block';
        const chart = new google.visualization.BarChart(document.getElementById('chart_div'));
        chart.draw(data, options);
    });
}

// Función para cerrar ventanas
function closeWindows() {
    document.getElementById("modal").classList.remove("mostrar");
    document.getElementById("informeDiv").style.display = "none";
}

// Función para mostrar la carga
function showLoading(show) {
    document.getElementById("Cargando").classList.toggle("mostrar", show);
}

// Función para hacer la petición a OMDb
function makeOMDbRequest() {
    if (isSearching || request) return;
    
    request = true;
    showLoading(true);
    
    const searchText = document.getElementById("input").value;
    const type = document.getElementById("tipo").value;
    
    const url = `https://www.omdbapi.com/?apikey=${API_KEY}&s=${searchText}&page=${currentPage}&type=${type}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.Response === "True") {
                // Buscar los detalles de cada película
                data.Search.forEach(movie => {
                    fetchMovieDetails(movie.imdbID);
                });
                
                currentPage++;
            }
        })
        .catch(error => {
            console.error("Error al cargar más películas:", error);
        })
        .finally(() => {
            request = false;
            showLoading(false);
        });
}
