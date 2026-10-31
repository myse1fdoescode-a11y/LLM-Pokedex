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
    let pokeData = await fetch(url, { signal })
    
    if (pokeData.status === 404 || pokeData.status === 403){
    throw new Error('We couldn\'t find that pokemon. Try adjusting spelling.')
    }  
    console.log(pokeData)
    if (!pokeData.ok) {
        throw new Error('Whoops! Looks like the pokemon you were searching for ran away. (Try again later)')
    }    
    
    pokeData = await pokeData.json()
    
    
    return pokeData    
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
        
        if (!error) return
        
        this.terminate()
        let errorText = document.createElement('h3')
        errorText.classList.add('error')
        errorText.textContent = error
        this.errorContainer.appendChild(errorText)
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


let searchForm = document.querySelector("form")
searchForm.addEventListener("submit", (event) => {
    event.preventDefault()
    const searchQuery = document.getElementById('search-query').value.toLowerCase().trim()
    
    laodPokemon(searchQuery)
})

let pokedexNavBtnBoth = document.querySelectorAll('.pokedex-nav-btn')
pokedexNavBtnBoth.forEach(btn => {
    btn.addEventListener('click', () => {
        pokedexSwipe(btn.dataset.direction === "next")
    })
})

function createStatRow(statObj) {
    const maxStat = 255
    const value = statObj.base_stat
    const name = statObj.stat.name
    const percent = Math.min((value/maxStat) * 100,100);

    let singleStatContainer = document.createElement('div')
    singleStatContainer.classList.add('stat-row')

        let statName = document.createElement('span')
        statName.classList.add('stat-name')
        statName.textContent = name

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
let pokedexCard = document.querySelector('div.pokedex-card')

function renderPokedexCard(pokemon) {
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
    let normalizeName = (s) => typeof s === "string" ? s[0].toLocaleUpperCase() + s.slice(1) : '';

    let cardHead = document.createElement('div')
    cardHead.classList.add('card-head')
        let pokemonName = document.createElement('h2')
        pokemonName.classList.add('pokemon-name')
        pokemonName.textContent = normalizeName(pokemon.name)
        let pokemonNumber = document.createElement('h3')
        pokemonNumber.classList.add("pokemon-number",'pixel-text')
        pokemonNumber.textContent = pokemon.id
        let typeContainer = document.createElement("div")
        typeContainer.classList.add('type-container')
        pokemon.types.forEach(typeObj => {
            let typeWrapper = document.createElement('span')
            let typeName = typeObj.type.name
            typeWrapper.textContent = typeName
            typeWrapper.classList.add('type',`${typeName}`)
            typeContainer.appendChild(typeWrapper)
        })
        cardHead.append(pokemonName,pokemonNumber,typeContainer)

    let cardTop = document.createElement('div')
    cardTop.classList.add('card-top')
        let spriteImageWrapper = document.createElement('figure')
        spriteImageWrapper.classList.add('card-img-top')
            let cardImage = document.createElement("img")
            cardImage.src = pokemon.sprites.front_default
            cardImage.alt = `Front facing ${pokemon.name}`
            spriteImageWrapper.appendChild(cardImage)
        cardTop.appendChild(spriteImageWrapper)

        let topInfoContainer = document.createElement("div")
        topInfoContainer.classList.add('card-info-top')
            
            let metricContainer = document.createElement('div')
            metricContainer.classList.add('metric-container','pixel-text')
                let pokemonHeight = document.createElement('p')
                pokemonHeight.classList.add('pokemon-height')
                pokemonHeight.textContent = pokemon.height
                let pokemonWeight = document.createElement('p')
                pokemonWeight.classList.add('pokemon-weight')
                pokemonWeight.textContent = pokemon.weight
            metricContainer.append(pokemonHeight,pokemonWeight)
            
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
        topInfoContainer.append(metricContainer,abilitiesContainer)
    cardTop.append(topInfoContainer)
    
    let statsContainer = document.createElement('div')
    statsContainer.classList.add('pokemon-stats')
    pokemon.stats.forEach(statObj => {
        let newStat = createStatRow(statObj)
        statsContainer.appendChild(newStat)
    })
    pokedexCard.append(cardHead,cardTop,statsContainer)
}