document.addEventListener('DOMContentLoaded', function() {
    fetchTranslationsAndApply();
    const form = document.getElementById('custom-search-form');
    const actionUrl = form.getAttribute('data-action-url');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitSearchForm();
    });

    function fetchTranslationsAndApply() {
        fetch('https://dev2.perseodesign.com/wp-admin/admin-ajax.php?action=get_translations', { // Modificare con url https://tuodominio.com/wp-admin/admin-ajax.php?action=get_translations
            method: 'GET',
            credentials: 'same-origin'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const t = data.data;
                document.getElementById('keyword1').placeholder = t.placeholderKeyword1;
                document.getElementById('keyword2').placeholder = t.placeholderKeyword2;
                document.getElementById('keyword3').placeholder = t.placeholderKeyword3;
                document.querySelector('#custom-search-form button[type="submit"]').textContent = t.searchButtonText;

                window.translations = t;
                
                const categoriesContainer = document.getElementById('category-checkboxes');
                categoriesContainer.innerHTML = '';
                Object.keys(t.categories).forEach(catId => {
                    const category = t.categories[catId];
                    const imageUrl = category.image; 
                    const catName = category.name;
                    const label = document.createElement('label');
                    label.innerHTML = `<input type="checkbox" name="category[]" value="${catId}" checked><img src="${imageUrl}" alt="${catName}" class="category-image">`;
                    categoriesContainer.appendChild(label);
                });
                
                console.log("Preparazione per inserire i tag", t.tags);

                if (t.tags && Array.isArray(t.tags)) {
                    const tagsContainer = document.getElementById('tag-select-container');
                    if (!tagsContainer) {
                        console.error("Container dei tag non trovato.");
                        return;
                    }
                    
                    let checkboxesHTML = '<div class="separator">Peculiarità aggiuntive</div><div class="tags-container">';
                    t.tags.forEach(tag => {
                        const imageUrl = tag.image; 
                        checkboxesHTML += `<label class="tag-item"><input type="checkbox" name="tags[]" value="${tag.id}"><img src="${imageUrl}" alt="${tag.name}" class="tag-image"></label>`;
                    });
                    checkboxesHTML += '</div>';
                    tagsContainer.innerHTML = checkboxesHTML;
                    console.log("Tag inseriti con successo.");
                } else {
                    console.log("Nessun tag da inserire.");
                }

            }
        })
        .catch(error => {
            console.error('Error fetching translations:', error);
        });
    }

    function isMobile() {
        return window.innerWidth <= 1024;
    }

    function submitSearchForm() {
		console.log("Lingua:", document.documentElement.lang);
        document.getElementById('search-results').innerHTML = ''; 
        const form = document.getElementById('custom-search-form');
        const formData = new FormData(form);
        formData.append('action', 'custom_search');
        formData.append('is_mobile', isMobile());
		formData.append('lang', document.documentElement.lang);

        const keyword1 = document.getElementById('keyword1').value.trim();
        const keyword2 = document.getElementById('keyword2').value.trim();
        const keyword3 = document.getElementById('keyword3').value.trim();
        formData.append('keyword1', keyword1);
        formData.append('keyword2', keyword2);
        formData.append('keyword3', keyword3);

        const categories = formData.getAll('category[]');
		console.log("Categorie selezionate:", categories);
        if (categories.length === 0) {
            showAlert('selectCategoryMsg');
            return;
        }

        let areAllKeywordsEmpty = true;

        if (keyword1.length > 0 || keyword2.length > 0 || keyword3.length > 0) {
            areAllKeywordsEmpty = false; 
        }

        if (areAllKeywordsEmpty) {
            showAlert('insertKeywordMsg');
            return;
        }

        fetch(actionUrl, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        })
        .then(response => {
            console.log('Risposta ricevuta dal server');
            return response.json();
        })
        .then(data => {
			if(data.success) {
				if (data.data.html && data.data.html.trim().length > 0) { 
					
					document.getElementById('search-results').innerHTML = data.data.html;
				} else {
					
					showAlert('noResultsMsg');
				}
			} else {
				showAlert('searchErrorMsg');
			}
		})
        .catch(error => {
            showAlert('genericErrorMsg');
        });
    }

    document.querySelectorAll('.closebtn').forEach(function(closeButton) {
        closeButton.addEventListener('click', function() {
            this.parentElement.style.display = 'none';
        });
    });

    function showAlert(messageKey) {
    const message = window.translations[messageKey] || window.translations['genericErrorMsg'];
    const alertContainer = document.getElementById('alert-container');
    document.getElementById('alert-msg').textContent = message;
    alertContainer.style.display = 'block';

    clearTimeout(window.alertTimeout);

    window.alertTimeout = setTimeout(function() {
        alertContainer.style.display = 'none';
    }, 5000);
}
});