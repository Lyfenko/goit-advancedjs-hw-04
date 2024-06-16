import axios from 'axios';
import iziToast from 'izitoast';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import 'izitoast/dist/css/iziToast.min.css';

const form = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');

let searchQuery = '';
let page = 1;
const perPage = 40;
const API_KEY = '44418416-01658c71a65aed4380a3ece44';
const BASE_URL = 'https://pixabay.com/api/';

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
        console.error(error);
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
    new SimpleLightbox('.gallery a', { captionDelay: 250 }).refresh();
};

const clearGallery = () => {
    gallery.innerHTML = '';
};

const smoothScroll = () => {
    const { height: cardHeight } = document.querySelector('.gallery').firstElementChild.getBoundingClientRect();
    window.scrollBy({
        top: cardHeight * 2,
        behavior: 'smooth'
    });
};

const observer = new IntersectionObserver(async (entries, observer) => {
    if (entries[0].isIntersecting) {
        page += 1;
        const data = await fetchImages(searchQuery, page);
        renderImages(data.hits);
        smoothScroll();
        if (page * perPage >= data.totalHits) {
            observer.disconnect();
            iziToast.info({ title: 'Info', message: "We're sorry, but you've reached the end of search results." });
        }
    }
}, { rootMargin: '200px' });

const handleSearch = async event => {
    event.preventDefault();
    searchQuery = event.currentTarget.elements.searchQuery.value.trim();
    if (!searchQuery) return;
    page = 1;
    clearGallery();

    const data = await fetchImages(searchQuery, page);
    if (data.hits.length === 0) {
        iziToast.error({ title: 'Error', message: 'Sorry, there are no images matching your search query. Please try again.' });
        return;
    }
    renderImages(data.hits);
    iziToast.success({ title: 'Success', message: `Hooray! We found ${data.totalHits} images.` });

    if (data.hits.length === perPage) {
        observer.observe(document.querySelector('.gallery').lastElementChild);
    }
};

form.addEventListener('submit', handleSearch);
