
// ? Data
let pokemonNames;
async function getInitNameData() {
    
    const initDataUrl = `https://pokeapi.co/api/v2/pokemon?limit=10000&offset=0`
    
    const response = await fetch(initDataUrl)

    checkFetchError(response)
    
    const data = await response.json()
    pokemonNames = data.results;
}

async function findPokeMatches(query="",selectedTypes="") {
    console.log(query,selectedTypes)
    console.log(pokemonNames.map(poke => poke.name))

    let matchesByName = pokemonNames.filter(({ name }) => 
        name.includes(query)
    );

    const pokemon = await Promise.all(
        matchesByName.map(({ name }) => getPokemonData(name))
    );
    
    if (!selectedTypes) return pokemon
    
    return pokemon.filter(poke => {
        selectedTypes.every(selectedType => 
            poke.types.some(({ type }) => type.name == selectedType)
        )
    })
}

let pokemonAbortController;
async function getPokemonData(query) {
    const url = `https://pokeapi.co/api/v2/pokemon/${query}`
    
    // if (pokemonAbortController) {
    //     pokemonAbortController.abort()
    // }
    
    // pokemonAbortController = new AbortController()
    // const { signal } = pokemonAbortController
    
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

const previewContainer = document.getElementById('preview-container')

const clearPreviews = () => previewContainer.replaceChildren()

const pokedex = document.getElementById('pokedex')

const getState = () => {
    const previewContainerIsActive = previewContainer.classList.contains('active')
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
    animateIntervalId: undefined,
    errorContainer: document.getElementById('error-container'),
    recentError: null,
    errorActive: null,
    
    setState() {
        const state = getState()
        this.loadState = state
        if (state === "pokedex") {
            this.pokedexLoadElmnt.classList.toggle('hidden',false)
            this.previewLoadElmnt.classList.toggle('hidden',true)
        } else if (state === "preview") {
            this.pokedexLoadElmnt.classList.toggle('hidden',true)
            this.previewLoadElmnt.classList.toggle('hidden',false)
        }
    },

    startLoad() {
        this.setErrorDisplay()
        this.setState()
        if (this.loadActive) {
            clearInterval(this.animateIntervalId)
        }
        this.loadActive = true
        let text;
        let img;
        let currentAngle = 0

        if (this.loadState === 'pokedex') {
            text = this.pokedexLoadElmnt.querySelector('h4')
            img = this.pokedexLoadElmnt.querySelector('img')

            const rotate = (angle=currentAngle) => {
                requestAnimationFrame(() => {
                    img.style.transform = `rotate(${angle}deg)`
                })
            }
            rotate(280)
            this.pokedexLoadElmnt.classList.toggle('hidden',false)
            this.animateIntervalId = setInterval(() => {

                let frame = Number(text.dataset.frame) + 1
                if (frame > 3) frame = 2
                text.dataset.frame = frame

                currentAngle += 280
                rotate()
            },500)
        }
    },

    terminate() {
        clearInterval(this.animateIntervalId)
        this.pokedexLoadElmnt.classList.toggle('hidden',true)
        this.previewLoadElmnt.classList.toggle('hidden',true)
        this.loadActive = false
    },

    setErrorDisplay(error=undefined) {
        this.errorContainer.replaceChildren()
        
        if (!error)  {
            this.errorContainer.classList.toggle('hidden',true)
            this.errorActive = false
            return
        }
        this.recentError = error
        this.errorActive = true
        this.terminate()
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
        previewContainer.classList.toggle('active',false)
        pokedex.classList.toggle('active',true)
    } else if (state === "preview") {
        previewContainer.classList.toggle('active',true)
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
    clearPokedex()
    pokedexCard.classList.add(`${pokemon.types[0].type.name}`)
    
    const cardHead = document.createElement('div')
    cardHead.classList.add('card-head')
        const cardHeadItems = createCardHead(pokemon)
        const typeNames = pokemon.types.map(typeObj => typeObj.type.name)
        console.log(typeNames)
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

    pokedexCard.append(cardHead,cardTop,speciesAccordionWrapper,statsContainer)
}

function renderPreviewCard(pokemon) {
    const previewCard = document.createElement('div')
    previewCard.classList.add('pokemon-theme-border', `${pokemon.types[0].type.name}`)
    
    const cardHeadItems = createCardHead(pokemon)
    const cardHead = document.createElement('div')
    cardHead.classList.add('preview-head')
    cardHead.append(cardHeadItems.name,cardHeadItems.number)

    const cardSprite = createSprite(pokemon)
    cardSprite.classList.add('preview-figure')
    const typeContainer = createTypeIcons(pokemon.types.map(typObj => typObj.type.name))
    typeContainer.classList.add('preview-type-container')

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

async function laodData(query,state) {
    if (typeof query === "string") query = query.trim().toLowerCase()
    /* 
        * Next time make it so that if a number is searched the pokedex card loads and 
        ? maybe style cards
        ? or stick with creating all the logic first
    */ 
    if (!query) return

    setState(state)
    loadState.setErrorDisplay()
    loadState.startLoad()
    
    try {
        if (state === "pokedex") {
            const pokemon = await getPokemonData(query)
            const species = await getPokemonSpecies(query)
            renderPokedexCard({pokemon, species})
        } else if (state === "preview") {
            clearPreviews()
            const matches = await findPokeMatches(query)
            for (const pokemon of matches) {
                const pokemonPreviewCard = renderPreviewCard(pokemon)
                previewContainer.appendChild(pokemonPreviewCard)
            }
        }

    } catch (error) {
        if (error.name !== "AbortError") {
            loadState.setErrorDisplay(error.message);
        }
    }
    finally {
        loadState.terminate()
    }
}

let perviousInput;
let searchForm = document.querySelector("form")
searchForm.addEventListener("submit", (event) => {
    event.preventDefault()
    const searchQuery = document.getElementById('search-query').value.toLowerCase().trim()
    if (perviousInput === searchQuery && loadState.errorActive) {
        return
    }
    perviousInput = searchQuery
    laodData(searchQuery,'preview')
})

let pokedexNavBtnBoth = document.querySelectorAll('.pokedex-nav-btn')
pokedexNavBtnBoth.forEach(btn => {
    btn.addEventListener('click', () => {
        pokedexSwipe(btn.dataset.direction === "next")
    })
})

let exitPokedexBtn = document.getElementById('exit-pokedex')
exitPokedexBtn.addEventListener('click', () => {
    clearPokedex()
    setState('preview')
})

getInitNameData()
    .then(() => console.dir(pokemonNames))
setState('preview')