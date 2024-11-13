document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const form = document.getElementById('copyForm');
    const outputDiv = document.getElementById('output');
    const copyButton = document.getElementById('copyButton');
    const suggestButton = document.getElementById('suggestButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Generate benefits inputs
    const benefitsGrid = document.querySelector('.benefits-grid');
    for (let i = 1; i <= 6; i++) {
        benefitsGrid.innerHTML += `
            <div class="benefit-input">
                <label for="benefit${i}">Benefit ${i}:</label>
                <input type="text" id="benefit${i}" name="benefit${i}" required>
            </div>
        `;
    }

    // Copy to clipboard functionality
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(outputDiv.textContent);
            copyButton.textContent = '✅ Copied!';
            copyButton.classList.add('copied');
            setTimeout(() => {
                copyButton.textContent = '📋 Copy to Clipboard';
                copyButton.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    });

    // Generate suggestions
    suggestButton.addEventListener('click', async function(e) {
        e.preventDefault();
        const apiKey = document.getElementById('apiKey').value;
        const productName = document.getElementById('productName').value;

        if (!apiKey || !productName) {
            alert('Please enter both API key and product name first!');
            return;
        }

        toggleLoading(true);
        try {
            const suggestions = await generateSuggestions(productName, apiKey);
            fillFormWithSuggestions(suggestions);
        } catch (error) {
            alert('Error generating suggestions. Please try again.');
        } finally {
            toggleLoading(false);
        }
    });

    // Form submission
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = collectFormData();
        
        showProgress();
        try {
            const generatedCopy = await generateCopy(formData);
            displayOutput(generatedCopy);
            copyButton.style.display = 'block';
        } catch (error) {
            showError();
        } finally {
            hideProgress();
        }
    });
});

// Helper functions
function toggleLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const suggestButton = document.getElementById('suggestButton');
    loadingIndicator.style.display = show ? 'block' : 'none';
    suggestButton.disabled = show;
}

function collectFormData() {
    const benefits = [];
    for (let i = 1; i <= 6; i++) {
        benefits.push(document.getElementById(`benefit${i}`).value);
    }

    // Get tone and language selections
    const tone = document.querySelector('input[name="tone"]:checked').value;
    const language = document.querySelector('input[name="language"]:checked').value;

    // Get offer details if they exist, otherwise set to null
    const normalPrice = document.getElementById('normalPrice').value 
        ? parseFloat(document.getElementById('normalPrice').value).toFixed(2)
        : null;
    const promoPrice = document.getElementById('promoPrice').value
        ? parseFloat(document.getElementById('promoPrice').value).toFixed(2)
        : null;
    const freeStuff = document.getElementById('freeStuff').value || null;
    const offerEnd = document.getElementById('offerEnd').value || null;
    const contactInfo = document.getElementById('contactInfo').value || null;

    return {
        apiKey: document.getElementById('apiKey').value,
        productName: document.getElementById('productName').value,
        problem: document.getElementById('problem').value,
        benefits,
        special: document.getElementById('special').value,
        tone,
        language,
        hasOffer: normalPrice || promoPrice || freeStuff || offerEnd,
        normalPrice,
        promoPrice,
        freeStuff,
        offerEnd,
        contactInfo
    };
}

function showProgress() {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<div class="progress-indicator">✨ Creating your copy...</div>';
    document.querySelector('button[type="submit"]').disabled = true;
}

function hideProgress() {
    document.querySelector('button[type="submit"]').disabled = false;
}

function showError() {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<div class="error">An error occurred while generating the copy. 😢</div>';
}

function displayOutput(content) {
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = content.replace(/\n/g, '<br>');
}

// Add these functions at the bottom of your script.js file

async function generateSuggestions(productName, apiKey) {
    const suggestionPrompt = `
    For a Malaysian product/service called "${productName}", generate realistic marketing details in JSON format with casual Malaysian style:
    {
        "problem": "describe a common problem this product/service solves (in Malaysian casual style)",
        "benefits": {
            "benefit1": "first benefit in casual Malaysian style",
            "benefit2": "second benefit in casual Malaysian style",
            "benefit3": "third benefit in casual Malaysian style",
            "benefit4": "fourth benefit in casual Malaysian style",
            "benefit5": "fifth benefit in casual Malaysian style",
            "benefit6": "sixth benefit in casual Malaysian style"
        },
        "special": "what makes this product/service unique (in Malaysian casual style)",
        "normalPrice": "suggest a realistic price in RM",
        "promoPrice": "suggest a promotional price in RM",
        "freeStuff": "suggest relevant free gifts or bonuses",
        "offerEnd": "suggest an offer end date/time",
        "contactInfo": "suggest a contact method"
    }`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{
                    role: "user",
                    content: suggestionPrompt
                }],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('Invalid response format from OpenAI');
        }

        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        console.error('Error in generateSuggestions:', error);
        throw error;
    }
}

async function generateCopy(formData) {
    const styleGuide = {
        colloquial: {
            english: {
                style: "casual Malaysian English style with some Manglish",
                pronouns: "you, your",
                examples: "gonna, wanna, super nice",
                tone: "friendly and chatty"
            },
            malay: {
                style: "casual Bahasa Malaysia with common slang",
                pronouns: "korang, awak",
                examples: "best gila, memang power, confirm puas hati",
                tone: "santai dan mesra"
            }
        },
        formal: {
            english: {
                style: "professional Malaysian English",
                pronouns: "you (formal), one",
                examples: "excellent quality, premium service",
                tone: "professional and respectful"
            },
            malay: {
                style: "Bahasa Malaysia formal/standard",
                pronouns: "anda, tuan/puan",
                examples: "kualiti terjamin, perkhidmatan cemerlang",
                tone: "profesional dan sopan"
            }
        }
    };

    const style = styleGuide[formData.tone][formData.language];

    let prompt = `
    Write a ${style.style} advertisement copy for ${formData.productName}.
    Use ${style.tone} tone with ${style.pronouns} as pronouns.
    Examples of language style: ${style.examples}

    1. Create an attention-grabbing headline for ${formData.productName}.

    2. Address this problem: ${formData.problem}

    3. Add 2-3 testimonials in this format:
    "testimonial statement" - Name, Location

    4. List these 6 benefits:
    ✅ ${formData.benefits[0]}
    ☑️ ${formData.benefits[1]}
    ✔️ ${formData.benefits[2]}
    💫 ${formData.benefits[3]}
    💯 ${formData.benefits[4]}
    ⭐ ${formData.benefits[5]}

    5. Special features:
    ${formData.special}
    `;

    // Add offer section if it exists
    if (formData.hasOffer) {
        const offerIntro = formData.language === 'malay' 
            ? "Untuk korang yang grab sekarang ni..." 
            : "For those who grab this now...";
            
        prompt += `\n\n6. Offer section starting with:
        "${offerIntro}"
        ${formData.normalPrice ? `- Normal price: RM${formData.normalPrice}` : ''}
        ${formData.promoPrice ? `- Promo price: RM${formData.promoPrice}` : ''}
        ${formData.freeStuff ? `- Free stuff: ${formData.freeStuff}` : ''}
        ${formData.offerEnd ? `- Offer ends: ${formData.offerEnd}` : ''}`;
    }

    // Add contact info if it exists
    if (formData.contactInfo) {
        prompt += `\n\n7. End with:
        - Contact info: ${formData.contactInfo}
        - Add urgency
        - Add 3 relevant hashtags`;
    } else {
        prompt += `\n\n7. End with:
        - Add 3 relevant hashtags`;
    }

    // Add style-specific instructions
    if (formData.tone === 'colloquial') {
        if (formData.language === 'malay') {
            prompt += `\n\nRemember to:
            - Write everything in a very casual, friendly tone
            - Use "korang" instead of "anda"
            - Add lots of emojis throughout
            - Use casual particles like "je", "ni", "tu"
            - Make it sound like chatting with friends
            - Use Malaysian slang words like "best", "power", "gempak"
            - Mix in some common Malaysian expressions like "confirm", "memang worth it", "takde lawan"
            `;
        } else {
            prompt += `\n\nRemember to:
            - Write in casual Malaysian English
            - Use friendly, conversational tone
            - Add appropriate emojis
            - Mix in some Manglish expressions
            - Use casual words like "gonna", "wanna"
            - Include Malaysian expressions like "sure can", "very nice one"
            `;
        }
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${formData.apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{
                    role: "user",
                    content: prompt
                }],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error in generateCopy:', error);
        throw error;
    }
}

function fillFormWithSuggestions(suggestions) {
    try {
        document.getElementById('problem').value = suggestions.problem;
        
        // Fill benefits
        for (let i = 1; i <= 6; i++) {
            document.getElementById(`benefit${i}`).value = suggestions.benefits[`benefit${i}`];
        }
        
        document.getElementById('special').value = suggestions.special;
        
        // Format prices to 2 decimal places
        const normalPrice = parseFloat(suggestions.normalPrice.replace(/[^\d.]/g, '')).toFixed(2);
        const promoPrice = parseFloat(suggestions.promoPrice.replace(/[^\d.]/g, '')).toFixed(2);
        
        document.getElementById('normalPrice').value = normalPrice;
        document.getElementById('promoPrice').value = promoPrice;
        document.getElementById('freeStuff').value = suggestions.freeStuff;
        document.getElementById('offerEnd').value = suggestions.offerEnd;
        document.getElementById('contactInfo').value = suggestions.contactInfo;
    } catch (error) {
        console.error('Error filling form with suggestions:', error);
        throw error;
    }
}