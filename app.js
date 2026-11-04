// ? Data
let globalController;
async function getPokemon(query) {
    if (typeof query === "string") query = query.trim().toLowerCase()
    const url = `https://pokeapi.co/api/v2/pokemon/${query}`
    
    if (globalController) {
        globalController.abort()
    }
    
    globalController = new AbortController()
    const { signal } = globalController
    
    let pokemon = await fetch(url, { signal })
    
    if (pokemon.status === 404 || pokemon.status === 403){
    throw new Error('Pokemon not found. Check the spelling or try a Pokedex number.')
    }

    if (!pokemon.ok) {
        throw new Error('Whoops! Looks like the pokemon you were searching for ran away. (Try again later)')
    }    
    
    pokemon = await pokemon.json()
    
    let species = await fetch(pokemon.species.url, { signal })
    if (!species.ok) {
        throw new Error("We couldn't load all of the pokemon's details. (Try again later.)")
    }
    species = await species.json()

    return {pokemon: pokemon,species: species}    
}

async function laodPokemon(query) {
    loadState.setErrorDisplay()
    loadState.startLoad()
    
    try {
        await getPokemon(query)
            .then(pokemon => renderPokedexCard(pokemon))
    } catch (error) {
        if (error !== "AbortError") {
            loadState.setErrorDisplay(error.message);
        }
    }
    finally {
        loadState.terminate()
    }
}

let getState = () => {
    const previewContainerIsActive = document.getElementById('preview-container').classList.contains('active')
    const pokedexIsActive = document.getElementById('pokedex').classList.contains('active')
    let state;
    if (previewContainerIsActive && pokedexIsActive) throw new Error('Both states are active')
    
    else if (pokedexIsActive) return 'pokedex'
    else if (previewContainerIsActive) return 'search-preview'
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
    
    startLoad() {
        this.setErrorDisplay()
        this.loadState = getState()
        if (this.loadActive) {
            clearInterval(this.animateIntervalId)
        }
        this.loadActive = true
        let text;
        let img;
        let currentAngle = 0

        const rotate = (angle=currentAngle) => {
            requestAnimationFrame(() => {
                img.style.transform = `rotate(${angle}deg)`
            })
        }
        rotate(280)
        if (this.loadState === 'pokedex') {
            text = this.pokedexLoadElmnt.querySelector('h4')
            img = this.pokedexLoadElmnt.querySelector('img')
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

// ? Ui

let pokedexSwipe = (forward) => {

    if (!pokedexCard.children[0] || getState() !== 'pokedex') return

    const nextOperator = forward ? 1: -1
    let pokemonId = document.querySelector('.pokemon-number').textContent
    pokemonId = Number(pokemonId)
    laodPokemon(pokemonId + nextOperator)

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
    laodPokemon(searchQuery)
})

let pokedexNavBtnBoth = document.querySelectorAll('.pokedex-nav-btn')
pokedexNavBtnBoth.forEach(btn => {
    btn.addEventListener('click', () => {
        pokedexSwipe(btn.dataset.direction === "next")
    })
})

let normalizeName = (s) => typeof s === "string" ? s[0].toLocaleUpperCase() + s.slice(1) : '';

let pokedexCard = document.querySelector('div.pokedex-card')

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
    
    pokedexCard.replaceChildren()
    pokedexCard.classList.add(`${pokemon.types[0].type.name}`)
        
        const cardHead = document.createElement('div')
        cardHead.classList.add('card-head')
        const cardHeadItems = createCardHead(pokemon)
        cardHead.append(cardHeadItems.name,cardHeadItems.number,createTypeIcons(pokemon))

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

function createCardHead(pokemon) {
    const pokemonName = document.createElement('h2')
    pokemonName.classList.add('pokemon-name')
    pokemonName.textContent = normalizeName(pokemon.name)
        const pokemonNumber = document.createElement('h3')
        pokemonNumber.classList.add("pokemon-number",'pixel-text')
        pokemonNumber.textContent = pokemon.id
        
        return {name:pokemonName,number:pokemonNumber}
}

function createTypeIcons(pokemon) {
    const typeContainer = document.createElement("div")
        typeContainer.classList.add('type-container')
        pokemon.types.forEach(typeObj => {
            const typeName = typeObj.type.name;
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