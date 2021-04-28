import React, {useState, useEffect} from 'react'
import {Row, Col, Nav, Button, ButtonGroup, InputGroup, Form} from 'react-bootstrap'

import {RenderChampMultilingue} from './ComponentMultilingue'

export default function PagesSites(props) {

  const [listeSites, setListeSites] = useState('')
  const [site, setSite] = useState('')
  useEffect(_=>{
    const connexionWorker = props.rootProps.connexionWorker
    chargerListeSites(connexionWorker, setListeSites)
  }, [])
  const setSiteId = siteId => {
    siteId = siteId.currentTarget?siteId.currentTarget.value:siteId
    if(siteId) {
      const siteSelect = listeSites.filter(site=>site.site_id===siteId)[0]
      setSite(siteSelect)
    } else {
      setSite('')
    }
  }

  if(site) {
    return <Site site={site}
                 retour={_=>setSiteId('')}
                 rootProps={props.rootProps} />
  }

  if(!listeSites) {
    return <p>Chargement des sites en cours ...</p>
  }

  return (
    <>
      <h2>Modifier les pages d'un site</h2>
      <Nav onSelect={setSiteId} className="flex-column">
        {
          listeSites.map(site=>(
            <Nav.Link key={site.site_id} eventKey={site.site_id}>{site.nom_site}</Nav.Link>
          ))
        }
        <Nav.Link onClick={props.retour}>Retour</Nav.Link>
      </Nav>
    </>
  )
}

function Site(props) {

  const [listeSections, setListeSections] = useState([])
  const [sectionId, setSectionId] = useState('')
  useEffect(_=>{
    const siteId = props.site.site_id
    chargerListeSections(props.rootProps.connexionWorker, siteId, setListeSections)
  }, [])

  if(sectionId) {
    const section = listeSections.filter(item=>item.section_id===sectionId)[0]
    return <PageSection site={props.site}
                        section={section}
                        retour={_=>setSectionId('')}
                        rootProps={props.rootProps} />
  }

  return (
    <>
      <h2>Modifier pages de {props.site.nom_site}</h2>

      {listeSections.length>0?
        <p>Choisir une section a modifier.</p>:
        <p>Il n'y a aucune section de type page pour ce site.</p>
      }

      <Nav onSelect={setSectionId} className="flex-column">
        {listeSections.map(section=>{
          return (
            <Nav.Link key={section.section_id} eventKey={section.section_id}>
              <RenderChampMultilingue champ={section.entete} defaut={section.section_id}/>
            </Nav.Link>
          )
        })}
      </Nav>

      <Button onClick={props.retour}>Retour</Button>
    </>
  )
}

function PageSection(props) {

  const [partiesPage, setPartiesPage] = useState([])
  const [listePartiesPage, setListePartiesPage] = useState([])
  const [typeSelectionne, setTypeSelectionne] = useState('texte')

  useEffect(_=>{
    console.debug("!!! Proppys %O", props)
    chargerPartiesPages(props.rootProps.connexionWorker, props.section.section_id, setPartiesPage)
  }, [])

  const boutonAjouterPartiePage = async event => {
    console.debug("Ajouter partie page de type %s", typeSelectionne)
    const sectionId = props.section.section_id,
          siteId = props.site.site_id
    const partiePage = await ajouterPartiePage(
      props.rootProps.connexionWorker, siteId, sectionId, typeSelectionne, partiesPage, setPartiesPage)
    // const listePartiesPageMaj = [...listePartiesPage, partiePage.partiepage_id]
    // setListePartiesPage(listePartiesPageMaj)
  }

  const boutonSauvegarderListe = event => {

  }

  const partiesPageDesactivees = partiesPage.filter(partiePage=>!listePartiesPage.includes(partiePage.partiepage_id))
  console.debug("Parties page desactivees : %O", partiesPageDesactivees)

  return (
    <>
      <h2>Modifier page{' '}
        <RenderChampMultilingue champ={props.section.entete} defaut={props.section.section_id}/>
      </h2>

      <Button>Sauvegarder modifications</Button>
      <Button variant="secondary" onClick={props.retour}>Retour</Button>

      <h3>Ajouter partie</h3>

      <InputGroup>
        <Form.Control as="select" name="typeSection" onChange={event=>{setTypeSelectionne(event.currentTarget.value)}}>
          <option value="texte">Texte</option>
          <option value="colonnes">Colonnes</option>
          <option value="media">Media (1 image ou video)</option>
        </Form.Control>
        <InputGroup.Append>
          <Button variant="secondary" onClick={boutonAjouterPartiePage}>Ajouter</Button>
        </InputGroup.Append>
      </InputGroup>

      <h3>Page</h3>
      {listePartiesPage.map(partiePageId=>{
        const partiePage = partiesPage.filter(item=>item.partiepage_id===partiePageId)[0]
        return <RenderPartiePage partiePage={partiePage}
                                 site={props.site}
                                 section={props.section}
                                 rootProps={props.rootProps} />
      })}

      <h3>Sections desactivees</h3>
      {partiesPageDesactivees.map(partiePage=>{
        return <RenderPartiePage key={partiePage.partiepage_id}
                                 partiePage={partiePage}
                                 site={props.site}
                                 section={props.section}
                                 rootProps={props.rootProps} />
      })}
    </>
  )
}

function RenderPartiePage(props) {
  const partiePage = props.partiePage || {}

  const type = partiePage.type_partie || ''
  var TypePage = TypePartiePageInconnu
  switch(type) {
    case 'texte': TypePage = PageTypeTexte; break
    case 'colonnes': TypePage = PageTypeColonnes; break
    case 'media': TypePage = PageTypeMedia; break
    default: TypePage = TypePartiePageInconnu
  }

  return (
    <>
      <ButtonGroup>
        <Button>
          <i className="fa fa-arrow-up"/>
        </Button>
        <Button>
          <i className="fa fa-arrow-down"/>
        </Button>
        <Button>
          Activer/desactiver
        </Button>
      </ButtonGroup>

      <TypePage partiePage={partiePage}
                site={props.site}
                section={props.section}
                rootProps={props.rootProps} />
    </>

  )
}

function PageTypeTexte(props) {
  return <p>Page type texte</p>
}

function PageTypeColonnes(props) {
  return <p>Page type colonnes</p>
}

function PageTypeMedia(props) {
  return <p>Page type media</p>
}

function TypePartiePageInconnu(props) {
  return (
    <p>Type page inconnu : {props.partiePage.type_partie}</p>
  )
}

async function chargerListeSites(connexionWorker, setListeSites) {
  const sites = await connexionWorker.requeteSites({})
  console.debug("Sites charges : %O", sites)
  setListeSites(sites)
}

async function chargerListeSections(connexionWorker, sectionId, setListeSections) {
  console.debug("Charger liste : %s", sectionId)
  var sections = await connexionWorker.requeteSectionsSite(sectionId)
  sections = sections.filter(section=>section.type_section === 'pages')
  setListeSections(sections)
}

async function chargerPartiesPages(connexionWorker, sectionId, setPartiesPages) {
  const partiesPage = await connexionWorker.requetePartiesPage(sectionId)
  setPartiesPages(partiesPage)
  console.debug("Parties page: %O", partiesPage)
}

async function ajouterPartiePage(connexionWorker, siteId, sectionId, typePartie, partiesPage, setPartiesPage) {
  console.debug("Ajouter partiePage siteId %s, sectionId %s, type %s", siteId, sectionId, typePartie)
  const reponse = await connexionWorker.ajouterPartiePage(siteId, sectionId, typePartie)
  console.debug("Reponse ajouterPartiePage: %O", reponse)
  const partiePage = reponse.partie_page
  partiesPage = [...partiesPage, reponse.partie_page]
  setPartiesPage(partiesPage)
  return partiePage
}

async function majPartiePage(connexionWorker, partiePageId, configuration, partiesPage, setPartiesPage) {
  const reponse = await connexionWorker.majPartiePage(partiePageId, configuration)
  console.debug("Reponse majPartiePage: %O", reponse)
  const partiePage = reponse.partie_page
  partiesPage = partiesPage.map(item=>{
    if(item.partiepage_id === partiePage.partiepage_id) return partiePage
    return item
  })
  setPartiesPage(partiesPage)
  return partiePage
}
