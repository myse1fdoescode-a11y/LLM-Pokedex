
// ? Data
let pokemonNames;
async function getInitNameData() {
    
    const initDataUrl = `https://pokeapi.co/api/v2/pokemon?limit=10000&offset=0`
    
    const response = await fetch(initDataUrl)

    checkFetchError(response)
    
    const data = await response.json()
    pokemonNames = data.results;
}

async function findPokeMatches(query="",selectedTypes=[]) {

    let matchesByName = pokemonNames.filter(({ name }) => 
        name.includes(query)
    );
    if (!matchesByName[0]) throw new Error("Pokemon not found. Check spelling or try a pokedex number.")
    
        const pokemon = await Promise.all(
        matchesByName.map(({ name }) => getPokemonData(name))
    );
    
    if (!selectedTypes[0]) return pokemon
    
    const finalResults = pokemon.filter(poke => {
        selectedTypes.every(selectedType => 
            poke.types.some(({ type }) => type.name == selectedType)
        )
    })
    if (!finalResults[0]) throw new Error('Whoops! Looks like the pokemon you were searching for ran away (Try again later).')
    
    return finalResults
}

let pokemonAbortController;
async function getPokemonData(query) {
    const url = `https://pokeapi.co/api/v2/pokemon/${query}`

    let pokemonData = await fetch(url)
    
    checkFetchError(pokemonData)
    
    pokemonData = await pokemonData.json()
    
    return pokemonData
}

let speciesController;
async function getPokemonSpecies(query) {
    const url = `https://pokeapi.co/api/v2/pokemon-species/${query}`

    if (speciesController) speciesController.abort()

    speciesController = new AbortController()
    const { signal } = speciesController
    
    let speciesData = await fetch(url, { signal })

    checkFetchError(speciesData)
    
    speciesData = await speciesData.json()
    
    return speciesData
}   


const checkFetchError = (fetchResponse) => {
    
    if (fetchResponse.status === 404 || fetchResponse.status === 403) {
        throw new Error('Pokemon not found. Check spelling or try a pokedex number.')
    }
    if (!fetchResponse.ok) {
        throw new Error('Whoops! Looks like the pokemon you were searching for ran away (Try again later).')
    }
}
const previewSection = document.getElementById('preview')
const previewContainer = document.getElementById('preview-container')

const pokedex = document.getElementById('pokedex')

const getState = () => {
    const previewContainerIsActive = previewSection.classList.contains('active')
    const pokedexIsActive = pokedex.classList.contains('active')
    
    if (previewContainerIsActive && pokedexIsActive) throw new Error('Both states are active')
        
        else if (pokedexIsActive) return 'pokedex'
        else if (previewContainerIsActive) return 'preview'
        else throw new Error('No Active State')
}


let loadState = {
    loadState: null,
    loadActive: null,
    pokedexLoadElmnt: document.querySelector('div.load-container > .pokedex'),
    previewLoadElmnt: document.querySelector('div.load-container > .preview'),
    text: null,
    img: null,
    animateIntervalId: undefined,
    errorContainer: document.getElementById('error-container'),
    recentError: null,
    errorActive: null,
    
    setState() {
        const state = getState()
        this.loadState = state
    },

    startLoad() {
        this.setErrorDisplay()
        this.setState()
        if (this.loadActive) {
            clearInterval(this.animateIntervalId)
        }
        this.loadActive = true

        const nextDotFrame = () => {
            let frame = Number(this.text.dataset.frame) + 1
            if (frame > 3) frame = 2
            this.text.dataset.frame = frame
        }

        if (this.loadState === 'pokedex') {
            this.pokedexLoadElmnt.classList.toggle('hidden',false)
            this.text = this.pokedexLoadElmnt.querySelector('h4')
            this.img = this.pokedexLoadElmnt.querySelector('img')
            
            let currentAngle = 280
            
            const rotate = (angle=currentAngle) => {
                requestAnimationFrame(() => {
                    this.img.style.transform = `rotate(${angle}deg)`
                })
            }
            rotate()
            this.pokedexLoadElmnt.classList.toggle('hidden',false)
            this.animateIntervalId = setInterval(() => {

                nextDotFrame()
                currentAngle += 280
                rotate()
            },500)
        } else if (this.loadState === 'preview') {
            this.previewLoadElmnt.classList.toggle('hidden',false)
            this.text = this.previewLoadElmnt.querySelector('h4')
            this.img = this.previewLoadElmnt.querySelector('figure')
            this.img.style.animation = "pokeball-wobble 2s ease-in infinite"
            const innerBall = this.img.querySelector('span')
            innerBall.style.animation = "animate-sphere-load-error 1s infinite ease-out"
            this.animateIntervalId = setInterval(() => nextDotFrame(),500)
        }
    },

    terminate() {
        if (this.loadState === "preview") {
            clearInterval(this.animateIntervalId)
            this.img.style.animation = "pokeball-load-nod 400ms ease-in"
            const innerBall = this.img.querySelector('span')
            innerBall.style.animation = "animate-sphere-success 400ms ease-in forwards"
            this.text.style.textAlign = "center"
            this.text.textContent = "Gotcha!"
            this.text.dataset.frame = 0
            return new Promise(resolve => setTimeout(() => {
                this.previewLoadElmnt.classList.toggle('hidden',true)
                this.loadActive = false
                resolve()
            },400))
        }
        clearInterval(this.animateIntervalId)
        this.pokedexLoadElmnt.classList.toggle('hidden',true)
        this.previewLoadElmnt.classList.toggle('hidden',true)
    },

    setErrorDisplay(error=undefined) {
        this.errorContainer.replaceChildren()
        
        if (!error)  {
            this.errorContainer.classList.toggle('hidden',true)
            this.previewLoadElmnt.classList.toggle('hidden',true)
            this.errorActive = false
            return
        }

        this.recentError = error
        this.errorActive = true
        if (this.loadState === "preview") {
            this.img.style.animation = "none"
            clearInterval(this.animateIntervalId)
            this.text.dataset.frame = 0
            this.text.style.textAlign = "left"
            const innerBall = this.img.querySelector('span')
            innerBall.style.animation = "none"
            innerBall.style.backgroundColor = "rgb(250, 46, 46)"
            this.text.textContent = error
            return
        }
        this.errorContainer.classList.toggle('hidden',false)
        const errorSvg = document.createElement('i')
        errorSvg.classList.add('fa-solid','fa-exclamation')
        const errorText = document.createElement('p')
        errorText.classList.add('error')
        errorText.textContent = error
        this.errorContainer.append(errorSvg,errorText)
    }
}

const setState = (state) => {
    if (state === "pokedex") {
        previewSection.classList.toggle('active',false)
        pokedex.classList.toggle('active',true)
    } else if (state === "preview") {
        previewSection.classList.toggle('active',true)
        pokedex.classList.toggle('active',false)
    }
    loadState.setState(state)
}

// ? Ui

let pokedexSwipe = (forward) => {

    if (!pokedexCard.children[0] || getState() !== 'pokedex') return

    const nextOperator = forward ? 1: -1
    let pokemonId = document.querySelector('.pokemon-number').textContent
    pokemonId = Number(pokemonId)
    laodData(pokemonId + nextOperator,'pokedex')

}


let normalizeName = (s) => typeof s === "string" ? s[0].toLocaleUpperCase() + s.slice(1) : '';

let pokedexCard = document.querySelector('div.pokedex-card')

const clearPokedex = () => pokedexCard.replaceChildren()

const clearPreviews = () => previewContainer.replaceChildren()

function renderPokedexCard(pokemonData) {
    const pokemon = pokemonData.pokemon
    const species = pokemonData.species
    
    const possibleTypes = [
        'normal','fire','water','grass',
        'electric','ice','fighting','poison',
        'ground','flying','psychic','bug',
        'rock','ghost','dragon','dark',
        'steel','fairy'
    ]
    possibleTypes.forEach((type) => {
        if (pokedexCard.classList.contains(type)) {
            pokedexCard.classList.remove(type)
        }
    })
    pokedexCard.classList.add(`${pokemon.types[0].type.name}`)
    
    const cardHead = document.createElement('div')
    cardHead.classList.add('card-head')
        const cardHeadItems = createCardHead(pokemon)
        const typeNames = pokemon.types.map(typeObj => typeObj.type.name)
        
        cardHead.append(cardHeadItems.name,cardHeadItems.number,createTypeIcons(typeNames))
        
        const cardTop = document.createElement('div')
        cardTop.classList.add('card-top')
        
        const spriteWrapper = createSprite(pokemon)
        
        const topInfoContainer = document.createElement("div")
        topInfoContainer.classList.add('card-info-top')
        
        const metricContainer = createMetrics(pokemon)
        const abilitiesContainer = createAbilities(pokemon)
        
        topInfoContainer.append(metricContainer,abilitiesContainer)
        cardTop.append(spriteWrapper,topInfoContainer)
        
        const speciesAccordionWrapper = createSpeciesAccordion(pokemon,species)
        
        const statsContainer = createStats(pokemon)
    clearPokedex()
    pokedexCard.append(cardHead,cardTop,speciesAccordionWrapper,statsContainer)
}

function renderPreviewCard(pokemon) {
    const previewCard = document.createElement('div')
    previewCard.classList.add('theme-color-border', `${pokemon.types[0].type.name}`,'preview-card')

    const cardHeadItems = createCardHead(pokemon)
    const cardHead = document.createElement('div')
    cardHead.classList.add('preview-head')
    cardHead.append(cardHeadItems.name,cardHeadItems.number)

    const cardSprite = createSprite(pokemon)
    cardSprite.classList.add('preview-figure')
    const typeContainer = createTypeIcons(pokemon.types.map(typObj => typObj.type.name))
    typeContainer.classList.remove('type-container')
    typeContainer.classList.add('preview-type-container','pixel-text')

    previewCard.append(cardHead,cardSprite,typeContainer)
    
    return previewCard
}

function createCardHead(pokemon) {
    const pokemonName = document.createElement('h2')
    pokemonName.classList.add('pokemon-name')
    pokemonName.textContent = normalizeName(pokemon.name)
    const pokemonNumber = document.createElement('h3')
        pokemonNumber.classList.add("pokemon-number",'pixel-text')
        pokemonNumber.textContent = pokemon.id
        
        return {name:pokemonName,number:pokemonNumber}
}
    
function createTypeIcons(typeNames) {
    const typeContainer = document.createElement("div")
    typeContainer.classList.add('type-container')
    typeNames.forEach( typeName => {
        const typeWrapper = document.createElement('span');
        const typeIcon = document.createElement("img");
        
        typeWrapper.classList.add('type-icon',`${typeName}`)
        typeIcon.src = `Images/icons/${typeName}.svg`
        typeIcon.alt = `${normalizeName(typeName)}`
        typeWrapper.appendChild(typeIcon)
        typeContainer.appendChild(typeWrapper)
    })
    return typeContainer
}

function createSprite(pokemon) {
    let spriteImageWrapper = document.createElement('figure')
    spriteImageWrapper.classList.add('card-img-top')
    let cardImage = document.createElement("img")
    cardImage.src = pokemon.sprites.front_default
    cardImage.alt = `Front facing ${pokemon.name}`
    spriteImageWrapper.appendChild(cardImage)
    return spriteImageWrapper
}

function createMetrics(pokemon) {
    let metricContainer = document.createElement('div')
    metricContainer.classList.add('metric-container','pixel-text')
    let pokemonHeight = document.createElement('p')
    pokemonHeight.classList.add('pokemon-height')
    pokemonHeight.textContent = pokemon.height
    pokemonHeight.dataset.height = pokemon.height
            
    let pokemonWeight = document.createElement('p')
    pokemonWeight.classList.add('pokemon-weight')
    pokemonWeight.textContent = pokemon.weight
    pokemonWeight.dataset.weight = pokemon.weight
    
    const arrorImg = document.createElement('img')
    arrorImg.src = "Images/arrowhead.png"
    arrorImg.alt = "arrow"
    pokemonHeight.prepend(arrorImg.cloneNode())
    pokemonWeight.prepend(arrorImg.cloneNode())
    
    metricContainer.append(pokemonHeight,pokemonWeight)
    return metricContainer
}

function createAbilities(pokemon) {
    let abilitiesContainer = document.createElement('div')
    abilitiesContainer.classList.add('ability-container')
            let abilitiesHeader = document.createElement("h3")
            abilitiesHeader.textContent = "Abilities:"
            let abilitiesList = document.createElement('ul')
            pokemon.abilities.forEach(abilityObj => {
                    let abilityElmnt = document.createElement('li')
                    abilityElmnt.textContent = normalizeName(abilityObj.ability.name)
                    abilitiesList.appendChild(abilityElmnt)
                });
                abilitiesContainer.append(abilitiesHeader,abilitiesList)
                return abilitiesContainer
}

function createStats(pokemon) {
    const statsContainer = document.createElement('div')
    statsContainer.classList.add('pokemon-stats')
    pokemon.stats.forEach(statObj => {
        let newStat = createStatRow(statObj)
        statsContainer.appendChild(newStat)
    })
    return statsContainer
}
    
function createStatRow(statObj) {
    const maxStat = 255
    const value = statObj.base_stat
    const name = statObj.stat.name
    const percent = Math.min((value/maxStat) * 100,100);
    
    let singleStatContainer = document.createElement('div')
    singleStatContainer.classList.add('stat-row')
    
    let statName = document.createElement('span')
    statName.classList.add('stat-name')
    statName.textContent = normalizeName(name)
    
    let statTrack = document.createElement('div')
    statTrack.classList.add('stat-track')
    statTrack.role = "meter"
    statTrack.ariaLabel = name
    statTrack.ariaValueMin ="0"
    statTrack.ariaValueMax ="255"
    statTrack.ariaValueNow = value
    
    let fill = document.createElement('div')
    fill.classList.add('stat-fill')
    statTrack.appendChild(fill)
    fill.style.width = "0%"
    requestAnimationFrame(() => {
        fill.style.width = `${percent}%`
    })
    // ? Considering making this a percent representing bar
    let statValue = document.createElement('span')
    statValue.classList.add('stat-value')
    statValue.textContent = value
    singleStatContainer.append(statName,statTrack,statValue)
    return singleStatContainer
}
            
function createSpeciesAccordion(pokemon,species) {
    const speciesEntry = species.flavor_text_entries.find(entry => entry.language.name === 'en');
    
    const speciesDescription = speciesEntry?.flavor_text.replace(/[\n\f]/g," ") 
    const pokemonGenus = species.genera.find(genera => genera.language.name === "en").genus
    const firstType = normalizeName(pokemon.types[0].type.name)
    const genusTitle =  pokemonGenus.includes(firstType) ? `The ${pokemonGenus}`: `The ${firstType} ${pokemonGenus}`
    
    let speciesInfoWrapper = document.createElement('div')
    speciesInfoWrapper.classList.add('species-accordion-wrapper')

    let speciesInfoAccordion = document.createElement('div')
    speciesInfoAccordion.classList.add('species-accordion','theme-color-border')
    let labelButton = document.createElement('button')
    labelButton.onclick = () => speciesInfoAccordion.classList.toggle('collapsed')
    labelButton.classList.add('label-btn','theme-color-border')
        let btnText = document.createElement('p')
        btnText.classList.add('genus-title')
        btnText.textContent = genusTitle
        btnText.ariaLabel = 'Species title'
        let btnArrow = document.createElement('img')
        btnArrow.src = "Images/arrowhead.png"
        btnArrow.alt = "Accordion arrow"
    labelButton.append(btnText,btnArrow)

    let speciesDescrpt = document.createElement('article')
    speciesDescrpt.classList.add('pokemon-description')
    speciesDescrpt.ariaLabel = 'Pokemon Description'
    speciesDescrpt.textContent = speciesDescription
    speciesInfoAccordion.append(labelButton,speciesDescrpt)
    speciesInfoWrapper.appendChild(speciesInfoAccordion)
    return speciesInfoWrapper
}

let previewResults;
const maxPageSize = 10;
let currentPage;
let totalPages;
const pageNumberElmnt = document.querySelector('.page-number')
const renderPage = (page) => {
    if (page > totalPages || page <= 0) return
    
    currentPage = page
    pageNumberElmnt.textContent = `${currentPage}/${totalPages}`

    clearPreviews()
    const start = 0 + maxPageSize * (page - 1)
    const renderToPokedex = (card) => {        
        const pokemonNumber = card.querySelector('.pokemon-number').textContent
        laodData(pokemonNumber,'pokedex')
    }

    if (page === totalPages) {
        previewResults.slice(start).forEach(pokemon => {
            const previewCard = renderPreviewCard(pokemon)
            previewCard.addEventListener('click',() => renderToPokedex(previewCard))
            previewContainer.append(previewCard)
        })
        return
    }
    const end = start + maxPageSize
    previewResults.slice(start,end).forEach(pokemon => {
        const previewCard = renderPreviewCard(pokemon)
        previewCard.addEventListener('click',() => renderToPokedex(previewCard))
        previewContainer.append(previewCard)
    })

}

async function laodData(query,state) {
    if (!query) return
    console.log(query)
    setState(state)
    loadState.setErrorDisplay()
    loadState.startLoad()
    
    try {
        if (state === "pokedex") {
            const pokemon = await getPokemonData(query)
            const species = await getPokemonSpecies(pokemon.species.name)
            renderPokedexCard({pokemon, species})
        } else if (state === "preview") {
            clearPreviews()
            previewResults = await findPokeMatches(query)
            
            if (previewResults.length % 10 === 0) {
                totalPages = previewResults.length / 10
            } else {
                totalPages = Math.ceil(previewResults.length / 10)
            }
            await loadState.terminate()
            renderPage(1)
        }

    } catch (error) {
        if (error.name !== "AbortError") {
            loadState.setErrorDisplay(error.message);
        }
    }
    finally {
        if (getState() === "pokedex") loadState.terminate();
    }
}

let perviousInput;
const searchForm = document.querySelector("form")
searchForm.addEventListener("submit", (event) => {
    event.preventDefault()
    const searchQuery = document.getElementById('search-query').value.toLowerCase().trim()
    
    if (perviousInput === searchQuery) {
        return
    }
    if (Number.isInteger(Number(searchQuery))) {
        laodData(searchQuery,'pokedex')
        return
    }
    perviousInput = searchQuery
    laodData(searchQuery,'preview')
})

const pokedexNavBtnBoth = document.querySelectorAll('.pokedex-nav-btn')
pokedexNavBtnBoth.forEach(btn => {
    btn.addEventListener('click', () => {
        pokedexSwipe(btn.dataset.direction === "next")
    })
})

const previewPageControls = document.querySelectorAll('.page-control')
previewPageControls.forEach(btn => {
    btn.addEventListener("click", (ev) => {
        const nextPage = ev.target.dataset.direction === "next" ? currentPage + 1 : currentPage -1
        renderPage(nextPage)
        previewSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
        })
    })
}) 

const exitPokedexBtn = document.getElementById('exit-pokedex')
exitPokedexBtn.addEventListener('click', () => {
    setState('preview')
})

getInitNameData()
    .then(() => console.dir(pokemonNames))