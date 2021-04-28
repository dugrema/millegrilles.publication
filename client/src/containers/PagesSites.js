import React, {useState, useEffect} from 'react'
import {Row, Col, Nav, Button, InputGroup, Form} from 'react-bootstrap'

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

      <p>Choisir une section a modifier.</p>
      <Nav onSelect={setSectionId} className="flex-column">
        {listeSections.map(section=>{
          const nomSection = section.nom_section || section.section_id
          return (
            <Nav.Link key={section.section_id} eventKey={section.section_id}>
              {nomSection}
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

  const ajouterSection = event => {
    console.debug("Ajouter section de type %s", typeSelectionne)
  }

  const sectionsDesactivees = partiesPage.filter(partiePage=>!listePartiesPage.includes(partiePage.partiepage_id))

  return (
    <>
      <h2>Modifier page</h2>

      <p>Page section</p>
      <Button variant="secondary" onClick={props.retour}>Retour</Button>

      <h3>Ajouter section</h3>

      <InputGroup>
        <Form.Control as="select" name="typeSection" onChange={event=>{setTypeSelectionne(event.currentTarget.value)}}>
          <option value="texte">Texte</option>
          <option value="colonnes">Colonnes</option>
          <option value="media">Media (1 image ou video)</option>
        </Form.Control>
        <InputGroup.Append>
          <Button variant="secondary" onClick={ajouterSection}>Ajouter</Button>
        </InputGroup.Append>
      </InputGroup>

      <h3>Page</h3>
      {listePartiesPage.map(partiePageId=>{
        const partiePage = listePartiesPage.filter(item=>item.partiepage_id===partiePageId)[0]
        return <RenderPartiePage partiePage={partiePage}
                                 site={props.site}
                                 section={props.section}
                                 rootProps={props.rootProps} />
      })}

      <h3>Sections desactivees</h3>
      {sectionsDesactivees.map(partiePage=>{
        return <RenderPartiePage partiePage={partiePage}
                                 site={props.site}
                                 section={props.section}
                                 rootProps={props.rootProps} />
      })}
    </>
  )
}

function RenderPartiePage(props) {
  var TypePage = TypePartiePageInconnu
  switch(props.partiePage.type) {
    default: TypePage = TypePartiePageInconnu
  }

  return <TypePage partiePage={props.partiePage}
                   site={props.site}
                   section={props.section}
                   rootProps={props.rootProps} />
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
  const sections = await connexionWorker.requeteSectionsSite(sectionId)
  setListeSections(sections)
}

async function chargerPartiesPages(connexionWorker, sectionId, setPartiesPages) {
  const partiesPage = await connexionWorker.requetePartiesPage(sectionId)
  setPartiesPages(partiesPage)
  console.debug("Parties page: %O", partiesPage)
}
