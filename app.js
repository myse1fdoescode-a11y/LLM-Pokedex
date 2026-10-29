// ? Data

async function getPokemon(query) {
    if (typeof query === "string") query = query.trim().toLowerCase()
    const url = `https://pokeapi.co/api/v2/pokemon/${query}`
    let pokeData = (await fetch(url))
    if (pokeData.status === 404){
        throw new Error('Endpoint does not exist')
    } else if (!pokeData.ok) {
        throw new Error('Unable to fetch')
    } 
    
    pokeData = await pokeData.json()
    return pokeData
    
}

let pokedexCard = document.querySelector('div.pokedex-card')
const errorContainer = document.getElementById('error-container')
let searchForm = document.querySelector("form")

searchForm.addEventListener("submit", (event) => {
    event.preventDefault()
    const searchQuery = document.getElementById('search-query').value.toLowerCase()
    
    errorContainer.replaceChildren()
    getPokemon(searchQuery)
        .then(pokemon => {
            renderPokexCard(pokemon)
        })
        .catch(error => displayError(error))
        
})

// ? Ui
let displayError = (err) => {
    errorContainer.replaceChildren()
    let errorText = document.createElement('h3')
    errorText.classList.add('error')
    errorText.textContent = err
    errorContainer.appendChild(errorText)
}

let pokedexSwipe = (forward) => {
    // will later need to also ask which state is active. (ie. pokedex or previews etc.)
    if (!pokedexCard.children[0]) return
    let nextOperator = forward ? 1: -1
    let pokemonId = document.querySelector('.pokemon-number').textContent
    pokemonId = Number(pokemonId)
    
    getPokemon(pokemonId + nextOperator)
        .then(pokemon =>  {
            renderPokexCard(pokemon)
        })
        .catch(error => displayError(error))
}

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

function renderPokexCard(pokemon) {
    pokedexCard.replaceChildren()

    let cardHead = document.createElement('div')
    cardHead.classList.add('card-head')
        let pokemonName = document.createElement('h3')
        pokemonName.classList.add('pokemon-name')
        pokemonName.textContent = pokemon.name
        let pokemonNumber = document.createElement('h3')
        pokemonNumber.classList.add("pokemon-number")
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
                metricContainer.classList.add('metric-container')
                    let metricHeader = document.createElement("h4")
                    metricHeader.textContent = "Metrics:"
                    let pokemonHeight = document.createElement('p')
                    pokemonHeight.classList.add('pokemon-height')
                    pokemonHeight.textContent = pokemon.height
                    let pokemonWeight = document.createElement('p')
                    pokemonWeight.classList.add('pokemon-weight')
                    pokemonWeight.textContent = pokemon.weight
                metricContainer.append(metricHeader,pokemonHeight,pokemonWeight)
                
                let abilitiesContainer = document.createElement('div')
                abilitiesContainer.classList.add('ability-container')
                    let abilitiesHeader = document.createElement("h4")
                    abilitiesHeader.textContent = "Abilities:"
                    let abilitiesList = document.createElement('ul')
                        pokemon.abilities.forEach(abilityObj => {
                            let abilityElmnt = document.createElement('li')
                            abilityElmnt.textContent = abilityObj.ability.name
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
    
    // let pokedexControlWrapperBack = document.createElement('aside')
    // pokedexControlWrapperBack.classList.add('pokedex-control-wrapper')
    
    // let backBtn = document.createElement('button')
    // backBtn.classList.add('pokedex-control')
    // backBtn.id = "back-control"
    // pokedexControlWrapperBack.appendChild(backBtn)

    // let pokedexControlWrapperNext = pokedexControlWrapperBack.cloneNode()
    // let nextBtn = document.createElement('button')
    // nextBtn.classList.add('pokedex-control')
    // nextBtn.id = "next-control"
    // pokedexControlWrapperNext.appendChild(nextBtn)
    
}
