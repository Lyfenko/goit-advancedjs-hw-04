import axios from 'axios';
import iziToast from 'izitoast';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import 'izitoast/dist/css/iziToast.min.css';

const form = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
const observerOptions = {
    rootMargin: '200px'
};

let searchQuery = '';
let page = 1;
const perPage = 40;
const API_KEY = '44418416-01658c71a65aed4380a3ece44';
const BASE_URL = 'https://pixabay.com/api/';

let lightbox; // Global instance for SimpleLightbox

const fetchImages = async (query, page) => {
    try {
        const response = await axios.get(BASE_URL, {
            params: {
                key: API_KEY,
                q: query,
                image_type: 'photo',
                orientation: 'horizontal',
                safesearch: true,
                page: page,
                per_page: perPage
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
    }
};

const renderImages = images => {
    const markup = images.map(image => `
        <a href="${image.largeImageURL}" class="photo-card">
            <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
            <div class="info">
                <p class="info-item"><b>Likes:</b> ${image.likes}</p>
                <p class="info-item"><b>Views:</b> ${image.views}</p>
                <p class="info-item"><b>Comments:</b> ${image.comments}</p>
                <p class="info-item"><b>Downloads:</b> ${image.downloads}</p>
            </div>
        </a>
    `).join('');
    gallery.insertAdjacentHTML('beforeend', markup);

    // Initialize SimpleLightbox only once
    if (!lightbox) {
        lightbox = new SimpleLightbox('.gallery a', { captionDelay: 250 });
    } else {
        lightbox.refresh();
    }
};

const clearGallery = () => {
    gallery.innerHTML = '';
};

const handleSearch = async event => {
    event.preventDefault();
    searchQuery = event.currentTarget.elements.searchQuery.value.trim();
    if (!searchQuery) {
        iziToast.error({ title: 'Error', message: 'Please enter a search query.' });
        return;
    }
    page = 1;
    clearGallery();

    try {
        const data = await fetchImages(searchQuery, page);
        if (data.hits.length === 0) {
            iziToast.error({ title: 'Error', message: `No images found for "${searchQuery}". Please try again.` });
            return;
        }
        renderImages(data.hits);
        iziToast.success({ title: 'Success', message: `Found ${data.totalHits} images for "${searchQuery}".` });

        if (data.hits.length === perPage) {
            observeLastImageElement();
        } else {
            iziToast.info({ title: 'Info', message: 'End of images.' });
        }
    } catch (error) {
        iziToast.error({ title: 'Error', message: 'Failed to fetch images. Please try again later.' });
        console.error('Error fetching images:', error);
    }
};

const observeLastImageElement = () => {
    const observer = new IntersectionObserver(async (entries, observer) => {
        if (entries[0].isIntersecting) {
            observer.unobserve(entries[0].target);

            page += 1;
            try {
                const data = await fetchImages(searchQuery, page);
                renderImages(data.hits);

                if (page * perPage >= data.totalHits) {
                    iziToast.info({ title: 'Info', message: "You've reached the end of search results." });
                } else {
                    observeLastImageElement();
                }
            } catch (error) {
                iziToast.error({ title: 'Error', message: 'Failed to fetch more images. Please try again later.' });
                console.error('Error fetching more images:', error);
            }
        }
    }, observerOptions);

    observer.observe(gallery.lastElementChild);
};

lightbox = new SimpleLightbox('.gallery a', { captionDelay: 250 });

form.addEventListener('submit', handleSearch);
