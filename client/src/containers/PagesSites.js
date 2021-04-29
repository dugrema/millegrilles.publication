import React, {useState, useEffect} from 'react'
import {Row, Col, Nav, Button, ButtonGroup, InputGroup, Form} from 'react-bootstrap'
import parse from 'html-react-parser'

import {RenderChampMultilingue, ChampSummernoteMultilingue, RenderValeursMultilingueRows} from './ComponentMultilingue'

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

  const updateSection = (section) => {
    const listeEdit = listeSections.map(item=>{
      if(item.section_id === section.section_id) return section
      return item
    })
    setListeSections(listeEdit)
  }

  if(sectionId) {
    const section = listeSections.filter(item=>item.section_id===sectionId)[0]
    return <PageSection site={props.site}
                        section={section}
                        retour={_=>setSectionId('')}
                        updateSection={updateSection}
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
  const [listePartiesPage, setListePartiesPage] = useState('')
  const [typeSelectionne, setTypeSelectionne] = useState('texte')

  const connexionWorker = props.rootProps.connexionWorker

  const listePartiesPageActuel = listePartiesPage || props.section.parties_pages || []
  // console.debug("Liste parties page actuel : %O", listePartiesPageActuel)

  useEffect(_=>{
    // console.debug("!!! Proppys %O", props)
    chargerPartiesPages(connexionWorker, props.section.section_id, setPartiesPage)
  }, [])

  const boutonAjouterPartiePage = async event => {
    // console.debug("Ajouter partie page de type %s", typeSelectionne)
    const sectionId = props.section.section_id,
          siteId = props.site.site_id
    const partiePage = await ajouterPartiePage(
      connexionWorker, siteId, sectionId, typeSelectionne, partiesPage, setPartiesPage)
    // const listePartiesPageMaj = [...listePartiesPage, partiePage.partiepage_id]
    // setListePartiesPage(listePartiesPageMaj)
  }

  const activerPartiePage = event => {
    const partipageId = event.currentTarget.value
    if(!listePartiesPageActuel.includes(partipageId)) {
      setListePartiesPage([...listePartiesPageActuel, partipageId])
    }
  }

  const desactiverPartiePage = event => {
    const partipageId = event.currentTarget.value
    if(listePartiesPageActuel.includes(partipageId)) {
      setListePartiesPage(listePartiesPageActuel.filter(item=>item!==partipageId))
    }
  }

  const boutonUpSection = event => {
    const partipageId = event.currentTarget.value
    var idx = listePartiesPageActuel.indexOf(partipageId)
    idx = idx-1
    const listeEdit = listePartiesPageActuel.filter(item=>item!==partipageId)
    listeEdit.splice(idx, 0, partipageId)
    setListePartiesPage(listeEdit)
  }

  const boutonDownSection = event => {
    const partipageId = event.currentTarget.value
    var idx = listePartiesPageActuel.indexOf(partipageId)
    idx = idx+1
    const listeEdit = listePartiesPageActuel.filter(item=>item!==partipageId)
    listeEdit.splice(idx, 0, partipageId)
    setListePartiesPage(listeEdit)
  }

  const boutonSauvegarderListe = async event => {
    const sectionId = props.section.section_id
    const sectionUpdatee = await sauvegarderSection(connexionWorker, sectionId, listePartiesPage)
    props.updateSection(sectionUpdatee)
    setListePartiesPage('')
  }

  const partiesPageDesactivees = partiesPage.filter(partiePage=>!listePartiesPageActuel.includes(partiePage.partiepage_id))
  // console.debug("Parties page desactivees : %O", partiesPageDesactivees)

  return (
    <>
      <h2>Modifier page{' '}
        <RenderChampMultilingue champ={props.section.entete} defaut={props.section.section_id}/>
      </h2>

      <Button onClick={boutonSauvegarderListe}>Sauvegarder modifications</Button>
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
      {listePartiesPageActuel.map((partiePageId, idx)=>{
        const partiePage = partiesPage.filter(item=>item.partiepage_id===partiePageId)[0] || ''
        return <RenderPartiePage key={partiePage.partiepage_id || idx}
                                 idx={idx}
                                 partiePage={partiePage}
                                 site={props.site}
                                 section={props.section}
                                 active={true}
                                 partiesPage={partiesPage}
                                 setPartiesPage={setPartiesPage}
                                 activerPartiePage={activerPartiePage}
                                 desactiverPartiePage={desactiverPartiePage}
                                 boutonUpSection={boutonUpSection}
                                 boutonDownSection={boutonDownSection}
                                 rootProps={props.rootProps} />
      })}

      <h3>Parties desactivees</h3>
      {partiesPageDesactivees.map(partiePage=>{
        return <RenderPartiePage key={partiePage.partiepage_id}
                                 partiePage={partiePage}
                                 site={props.site}
                                 section={props.section}
                                 active={false}
                                 partiesPage={partiesPage}
                                 setPartiesPage={setPartiesPage}
                                 activerPartiePage={activerPartiePage}
                                 desactiverPartiePage={desactiverPartiePage}
                                 rootProps={props.rootProps} />
      })}
    </>
  )
}

function RenderPartiePage(props) {

  const [editionEnCours, setEditionEnCours] = useState(false)
  const [contenuEditionEnCours, setContenuEditionEnCours] = useState('')

  const partiePage = props.partiePage || {}
  const type = partiePage.type_partie || ''

  const partiepageId = partiePage.partiepage_id

  const sauvegarder = async event => {
    // console.debug("Sauvegarder %O", contenuEditionEnCours)
    const sectionId = props.section.section_id
    const reponse = await majPartiePage(
      props.rootProps.connexionWorker, partiepageId, contenuEditionEnCours,
      props.partiesPage, props.setPartiesPage
    )
    // console.debug("Reponse maj section : %O", reponse)
    setContenuEditionEnCours('')
    setEditionEnCours(false)
  }

  var TypePage = TypePartiePageInconnu
  switch(type) {
    case 'texte': TypePage = PageTypeTexte; break
    case 'colonnes': TypePage = PageTypeColonnes; break
    case 'media': TypePage = PageTypeMedia; break
    default: TypePage = TypePartiePageInconnu
  }

  return (
    <div className="partie-page-edit">
      <Row>
        <Col md={2}>
          <h4>{type}</h4>
        </Col>
        <Col>
          <ButtonGroup>

            <Button variant="secondary"
                    onClick={props.boutonUpSection}
                    disabled={!props.active || props.idx===0}
                    value={partiepageId}>
              <i className="fa fa-arrow-up"/>
            </Button>

            <Button variant="secondary"
                    onClick={props.boutonDownSection}
                    disabled={!props.active}
                    value={partiepageId}>
              <i className="fa fa-arrow-down"/>
            </Button>

            {editionEnCours?
              <>
                <Button onClick={sauvegarder}>Sauvegarder</Button>
                <Button variant="secondary" onClick={_=>setEditionEnCours(false)}>Annuler</Button>
              </>
              :
              <Button variant="secondary" onClick={_=>setEditionEnCours(true)}>Editer</Button>
            }

            {props.active?
              <Button variant="secondary"
                      onClick={props.desactiverPartiePage}
                      value={partiepageId}>Desactiver</Button>
              :
              <Button variant="secondary"
                      onClick={props.activerPartiePage}
                      value={partiepageId}>Activer</Button>
            }

          </ButtonGroup>
        </Col>
      </Row>

      <TypePage partiePage={partiePage}
                site={props.site}
                section={props.section}
                active={props.active}
                editionEnCours={editionEnCours}
                contenuEditionEnCours={contenuEditionEnCours}
                setContenuEditionEnCours={setContenuEditionEnCours}
                rootProps={props.rootProps} />

    </div>
  )
}

function PageTypeTexte(props) {

  const contenuEditionEnCours = props.contenuEditionEnCours || ''
  const html = contenuEditionEnCours.html || props.partiePage.html || props.site.languages.reduce((acc, item)=>{
    acc[item] = ''
    return acc
  }, {})

  const changerContenu = params => {
    // console.debug("Changer contenu texte summernote : %O", params)
    const htmlEdit = {...html} // Shallow copy
    htmlEdit[params.langue] = params.value
    const contenuEdit = {...contenuEditionEnCours, html: htmlEdit}
    props.setContenuEditionEnCours(contenuEdit)
  }

  if(props.editionEnCours) {
    // console.debug("!!!PROPS editionEnCours: %O", props)
    return (
      <ChampSummernoteMultilingue name="html"
                                  languages={props.site.languages}
                                  values={html}
                                  onChange={changerContenu} />
    )
  }

  var htmlParsed = null
  if(html) {
    htmlParsed = Object.keys(html).reduce((acc, lang)=>{
      acc[lang] = parse(html[lang])
      return acc
    }, {})
  }

  // console.debug("Afficher html %O, htmlParsed: %O", html, htmlParsed)

  return (
    <RenderValeursMultilingueRows champ={htmlParsed} languages={props.site.languages}/>
  )
}

function PageTypeColonnes(props) {
  const [colonneIdx, setColonneIdx] = useState('')
  const [colonnes, setColonnes] = useState('')

  const ajouterColonne = _ => {
    setColonnes([...colonnes, {}])
  }
  const supprimerColonne = _ => {
    if(colonnes) {
      const idxCourant = Number(colonneIdx)
      setColonnes(colonnes.filter((_, idxCol)=>idxCol !== idxCourant))
    }
    setColonneIdx('')
  }

  if(props.editionEnCours) {
    // Mode edition, on affiche une seule colonne a la fois
    const colonnesCourantes = colonnes || props.section.colonnes || []

    var contenuColonne = ''
    if(colonneIdx) {
      contenuColonne = colonnesCourantes[colonneIdx] || ''
    }

    return (
      <>
        <Nav variant="pills" onSelect={setColonneIdx}>
          {colonnesCourantes.map((item, idx)=>{
            return (
              <Nav.Item key={idx}><Nav.Link eventKey={idx}>Colonne {idx}</Nav.Link></Nav.Item>
            )
          })}
          <Nav.Item><Nav.Link onClick={ajouterColonne}><i className="fa fa-plus"/></Nav.Link></Nav.Item>
        </Nav>

        <Button onClick={supprimerColonne}>Supprimer</Button>

        <PageColonne contenu={contenuColonne} />
      </>
    )
  }

  // Mode affichage colonnes
  if(!props.section.colonnes) return ''

}

function PageColonne(props) {
  return <p>Colonne</p>
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
  // console.debug("Sites charges : %O", sites)
  setListeSites(sites)
}

async function chargerListeSections(connexionWorker, sectionId, setListeSections) {
  // console.debug("Charger liste : %s", sectionId)
  var sections = await connexionWorker.requeteSectionsSite(sectionId)
  sections = sections.filter(section=>section.type_section === 'pages')
  setListeSections(sections)
}

async function chargerPartiesPages(connexionWorker, sectionId, setPartiesPages) {
  const partiesPage = await connexionWorker.requetePartiesPage(sectionId)
  setPartiesPages(partiesPage)
  // console.debug("Parties page: %O", partiesPage)
}

async function sauvegarderSection(connexionWorker, sectionId, listePartiesPage) {
  const reponse = await connexionWorker.majSection({section_id: sectionId, parties_pages: listePartiesPage})
  // console.debug("Reponse sauvegarder section : %O", reponse)
  return reponse.section
}

async function ajouterPartiePage(connexionWorker, siteId, sectionId, typePartie, partiesPage, setPartiesPage) {
  // console.debug("Ajouter partiePage siteId %s, sectionId %s, type %s", siteId, sectionId, typePartie)
  const reponse = await connexionWorker.ajouterPartiePage(siteId, sectionId, typePartie)
  // console.debug("Reponse ajouterPartiePage: %O", reponse)
  const partiePage = reponse.partie_page
  partiesPage = [...partiesPage, reponse.partie_page]
  setPartiesPage(partiesPage)
  return partiePage
}

async function majPartiePage(connexionWorker, partiePageId, configuration, partiesPage, setPartiesPage) {
  const reponse = await connexionWorker.majPartiePage(partiePageId, configuration)
  // console.debug("Reponse majPartiePage: %O", reponse)
  const partiePage = reponse.partie_page

  // console.debug("PartiesPage existant : %O", partiesPage)
  partiesPage = partiesPage.map(item=>{
    if(item.partiepage_id === partiePage.partiepage_id) return partiePage
    return item
  })
  setPartiesPage(partiesPage)
  return partiePage
}
