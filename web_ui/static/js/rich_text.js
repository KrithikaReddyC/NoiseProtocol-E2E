// Rich Text & Media Support for Noise Protocol Chat
// Handles markdown, syntax highlighting, link previews, images, and GIFs

(function() {
    'use strict';

    // Configure marked.js for markdown parsing
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            gfm: true, // GitHub Flavored Markdown
            breaks: true, // Convert \n to <br>
            pedantic: false,
            sanitize: false, // We'll use DOMPurify instead
            smartLists: true,
            smartypants: true,
            highlight: function(code, lang) {
                // Syntax highlighting with highlight.js
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('Highlight.js error:', err);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        });
    }

    // Regular expressions for detecting media
    const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?$/i;
    const GIPHY_REGEX = /https?:\/\/(media\.giphy\.com|giphy\.com\/gifs)/i;
    const TENOR_REGEX = /https?:\/\/(media\.tenor\.com|tenor\.com)/i;

    /**
     * Process message content with markdown and rich text features
     * @param {string} content - The raw message content
     * @param {object} options - Processing options
     * @returns {string} Processed HTML content
     */
    window.processRichText = function(content, options = {}) {
        if (!content) return '';

        const {
            enableMarkdown = true,
            enableLinkPreviews = true,
            enableImagePreview = true,
            enableGIFs = true
        } = options;

        console.log('[RichText] Processing content:', content.substring(0, 100));
        let processedContent = content;

        // Step 1: Process markdown if enabled
        if (enableMarkdown && typeof marked !== 'undefined') {
            try {
                processedContent = marked.parse(processedContent);
            } catch (err) {
                console.error('Markdown parsing error:', err);
                // Fallback to plain text with line breaks
                processedContent = content.replace(/\n/g, '<br>');
            }
        } else {
            // No markdown - just convert line breaks
            processedContent = content.replace(/\n/g, '<br>');
        }

        // Step 2: Sanitize HTML with DOMPurify
        if (typeof DOMPurify !== 'undefined') {
            processedContent = DOMPurify.sanitize(processedContent, {
                ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
                    'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody',
                    'tr', 'th', 'td', 'hr', 'div', 'span'
                ],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'style', 'data-url']
            });
        }

        // Step 3: Enhance links with target="_blank" and rel="noopener noreferrer"
        processedContent = enhanceLinks(processedContent);

        // Step 4: Detect and embed images
        if (enableImagePreview) {
            processedContent = embedImages(processedContent);
        }

        // Step 5: Apply syntax highlighting to code blocks
        setTimeout(() => {
            document.querySelectorAll('pre code').forEach((block) => {
                if (typeof hljs !== 'undefined') {
                    hljs.highlightElement(block);
                }
            });
        }, 100);

        console.log('[RichText] Processing complete. Output length:', processedContent.length);
        return processedContent;
    };

    /**
     * Enhance links with security attributes and detect link previews
     * @param {string} html - HTML content
     * @returns {string} Enhanced HTML
     */
    function enhanceLinks(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Find all links
        const links = tempDiv.querySelectorAll('a');
        links.forEach(link => {
            // Add security attributes
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');

            // Add class for styling
            link.classList.add('rich-text-link');

            // Store URL for potential link preview
            const url = link.getAttribute('href');
            if (url) {
                link.setAttribute('data-url', url);
            }
        });

        return tempDiv.innerHTML;
    }

    /**
     * Detect and embed images from URLs
     * @param {string} html - HTML content
     * @returns {string} HTML with embedded images
     */
    function embedImages(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Find all links that point to images
        const links = tempDiv.querySelectorAll('a');
        console.log('[RichText] Found', links.length, 'links to check for images');

        links.forEach(link => {
            const url = link.getAttribute('href');
            console.log('[RichText] Checking URL:', url, 'Matches image regex:', IMAGE_URL_REGEX.test(url));

            if (url && IMAGE_URL_REGEX.test(url)) {
                console.log('[RichText] Embedding image:', url);
                // Create container
                const container = document.createElement('div');
                container.classList.add('rich-text-image-container');

                // Create clickable image link wrapper
                const imageLink = document.createElement('a');
                imageLink.href = url;
                imageLink.target = '_blank';
                imageLink.rel = 'noopener noreferrer';

                // Create image element
                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Shared image';
                img.classList.add('rich-text-image', 'img-fluid', 'rounded', 'mt-2');
                img.style.maxWidth = '100%';
                img.style.maxHeight = '300px';
                img.style.display = 'block';

                imageLink.appendChild(img);
                container.appendChild(imageLink);

                // Create caption
                const caption = document.createElement('div');
                caption.classList.add('rich-text-image-caption');
                caption.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i> View full size</a>`;
                container.appendChild(caption);

                // Replace link with container
                link.parentNode.replaceChild(container, link);
            }
        });

        return tempDiv.innerHTML;
    }

    /**
     * Fetch and display link preview
     * @param {string} url - URL to fetch preview for
     * @param {string} messageId - Message ID to attach preview to
     */
    window.fetchLinkPreview = function(url, messageId) {
        if (!url || !messageId) return;

        // Make AJAX request to backend for OpenGraph data
        $.ajax({
            url: '/link_preview',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ url: url }),
            success: function(response) {
                if (response.success && response.preview) {
                    displayLinkPreview(response.preview, messageId);
                }
            },
            error: function(err) {
                console.error('Link preview fetch error:', err);
            }
        });
    };

    /**
     * Display link preview in message
     * @param {object} preview - Preview data from OpenGraph
     * @param {string} messageId - Message ID
     */
    function displayLinkPreview(preview, messageId) {
        const messageElement = $(`.message[data-message-id="${messageId}"]`);
        if (!messageElement.length) return;

        // Check if preview already exists
        if (messageElement.find('.link-preview').length > 0) return;

        const previewHtml = `
            <div class="link-preview card mt-2">
                <div class="card-body p-2">
                    <div class="row g-2">
                        ${preview.image ? `
                            <div class="col-4">
                                <img src="${preview.image}" class="img-fluid rounded" alt="${preview.title || 'Preview'}">
                            </div>
                        ` : ''}
                        <div class="${preview.image ? 'col-8' : 'col-12'}">
                            <div class="link-preview-title fw-bold">${preview.title || 'Link Preview'}</div>
                            ${preview.description ? `<div class="link-preview-description small text-muted">${preview.description}</div>` : ''}
                            ${preview.site_name ? `<div class="link-preview-site small"><i class="bi bi-globe"></i> ${preview.site_name}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        messageElement.find('.message-content').after(previewHtml);
    }

    /**
     * Add GIF picker button to message input
     */
    window.initGIFPicker = function() {
        // Check if button already exists
        if ($('#gif-picker-btn').length > 0) return;

        // Add GIF button next to file button
        const gifButton = $('<button>')
            .attr('id', 'gif-picker-btn')
            .attr('type', 'button')
            .addClass('btn btn-secondary')
            .attr('disabled', true)
            .html('<i class="bi bi-filetype-gif"></i>')
            .attr('title', 'Insert GIF');

        $('#file-btn').after(gifButton);

        // Enable when connected
        $(document).on('connected', function() {
            gifButton.prop('disabled', false);
        });

        // GIF picker modal
        gifButton.on('click', function() {
            showGIFPicker();
        });
    };

    /**
     * Show GIF picker modal
     */
    function showGIFPicker() {
        // Create modal if it doesn't exist
        if ($('#gifPickerModal').length === 0) {
            const modalHtml = `
                <div class="modal fade" id="gifPickerModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title"><i class="bi bi-filetype-gif me-2"></i>Select a GIF</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-3">
                                    <input type="text" class="form-control" id="gif-search-input" placeholder="Search for GIFs...">
                                </div>
                                <div id="gif-results" class="row g-2">
                                    <div class="col-12 text-center text-muted">
                                        <i class="bi bi-search fs-1"></i>
                                        <p>Search for GIFs above</p>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            $('body').append(modalHtml);

            // Set up search functionality
            let searchTimeout;
            $('#gif-search-input').on('input', function() {
                clearTimeout(searchTimeout);
                const query = $(this).val().trim();

                if (query.length < 2) {
                    $('#gif-results').html('<div class="col-12 text-center text-muted"><p>Type at least 2 characters to search</p></div>');
                    return;
                }

                searchTimeout = setTimeout(() => {
                    searchGIFs(query);
                }, 500);
            });
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('gifPickerModal'));
        modal.show();
    }

    /**
     * Search for GIFs via backend
     * @param {string} query - Search query
     */
    function searchGIFs(query) {
        $('#gif-results').html('<div class="col-12 text-center"><div class="spinner-border" role="status"></div><p>Searching...</p></div>');

        $.ajax({
            url: '/search_gifs',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ query: query }),
            success: function(response) {
                if (response.success && response.gifs && response.gifs.length > 0) {
                    displayGIFResults(response.gifs);
                } else {
                    $('#gif-results').html('<div class="col-12 text-center text-muted"><p>No GIFs found</p></div>');
                }
            },
            error: function(err) {
                console.error('GIF search error:', err);
                $('#gif-results').html('<div class="col-12 text-center text-danger"><p>Error searching for GIFs</p></div>');
            }
        });
    }

    /**
     * Display GIF search results
     * @param {array} gifs - Array of GIF objects
     */
    function displayGIFResults(gifs) {
        let html = '';
        gifs.forEach(gif => {
            html += `
                <div class="col-md-3 col-sm-4 col-6">
                    <div class="gif-item" data-url="${gif.url}" style="cursor: pointer;">
                        <img src="${gif.preview}" class="img-fluid rounded" alt="${gif.title || 'GIF'}">
                    </div>
                </div>
            `;
        });

        $('#gif-results').html(html);

        // Add click handlers
        $('.gif-item').on('click', function() {
            const gifUrl = $(this).data('url');
            insertGIFIntoMessage(gifUrl);

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('gifPickerModal'));
            modal.hide();
        });
    }

    /**
     * Insert GIF URL into message input
     * @param {string} url - GIF URL
     */
    function insertGIFIntoMessage(url) {
        const messageInput = $('#message-input');
        const currentText = messageInput.val();

        // Add URL to message
        const newText = currentText ? `${currentText}\n${url}` : url;
        messageInput.val(newText);
        messageInput.focus();
    }

    /**
     * Extract URLs from message content
     * @param {string} content - Message content
     * @returns {array} Array of URLs
     */
    window.extractURLs = function(content) {
        if (!content) return [];
        const matches = content.match(URL_REGEX);
        return matches || [];
    };

    /**
     * Check if URL is an image
     * @param {string} url - URL to check
     * @returns {boolean}
     */
    window.isImageURL = function(url) {
        return IMAGE_URL_REGEX.test(url);
    };

    /**
     * Check if URL is a GIF service
     * @param {string} url - URL to check
     * @returns {boolean}
     */
    window.isGIFURL = function(url) {
        return GIPHY_REGEX.test(url) || TENOR_REGEX.test(url);
    };

    // Initialize when document is ready
    $(document).ready(function() {
        console.log('Rich text support initialized');

        // Initialize GIF picker
        initGIFPicker();

        // Add markdown help tooltip
        addMarkdownHelp();
    });

    /**
     * Add markdown formatting help tooltip
     */
    function addMarkdownHelp() {
        // Add help icon next to message input
        if ($('#markdown-help-btn').length > 0) return;

        const helpButton = $('<button>')
            .attr('id', 'markdown-help-btn')
            .attr('type', 'button')
            .addClass('btn btn-link btn-sm text-muted')
            .html('<i class="bi bi-question-circle"></i>')
            .attr('title', 'Markdown formatting help')
            .attr('data-bs-toggle', 'tooltip')
            .attr('data-bs-placement', 'top')
            .attr('data-bs-html', 'true')
            .attr('data-bs-title', `
                <div class="text-start">
                    <strong>Markdown Help:</strong><br>
                    **bold** <em>*italic*</em><br>
                    \`code\` <code>code</code><br>
                    # Heading<br>
                    - List item<br>
                    [link](url)<br>
                    ![image](url)
                </div>
            `);

        $('.card-footer form').append(helpButton);

        // Initialize Bootstrap tooltip
        new bootstrap.Tooltip(helpButton[0]);
    }

})();
