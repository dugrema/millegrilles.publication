import React, {useState, useEffect} from 'react'
import {Row, Col, Button, ButtonGroup, Form, FormControl, InputGroup, Alert, Nav} from 'react-bootstrap'

import {ChampInputMultilingue} from './InfoSite'

export default class SectionsSite extends React.Component {

  state = {
    listeSections: '',  // Liste ordonnee de section_id

    sectionId: '',      // Section en cours de modification
    typeSection: '',

    // Contenu de reference (pick lists)
    collectionsPubliques: '',
    forums: '',
    listeSectionsConnues: '',

    err: '',
    confirmation: '',
  }

  componentDidMount() {
    // Charger collections publiques
    const wsa = this.props.rootProps.websocketApp
    wsa.requeteCollectionsPubliques().then(reponse=>{
      const collections = reponse.resultat
      console.debug("Collections publiques : %O", collections)
      this.setState({collectionsPubliques: collections})
    }).catch(err=>{this.setState({err: this.state.err + '\n' + err})})

    chargerForums(wsa, forums=>this.setState({forums}))
    chargerSectionsConnues(wsa, this.props.site.site_id, listeSectionsConnues=>this.setState({listeSectionsConnues}))
  }

  setSectionId = event => {
    const sectionId = event.currentTarget?event.currentTarget.value:event
    console.debug("Set sectionId: %s", sectionId)
    this.setState({sectionId, typeSection: ''})
  }

  ajouterSection = event => {
    var typeSection = event.currentTarget.value
    this.setState({sectionId: true, typeSection})
  }

  insererNouvelleSection = sectionId => {
    if(!sectionId) return
    var listeSections = this.state.listeSections || this.props.site.liste_sections || []
    listeSections = [...listeSections, sectionId]
    this.setState({listeSections})
  }

  majSectionSite = section => {
    // Met a jour la section en memoire suite a une modification (confirmee)
    let trouve = false
    var listeSectionsConnues = this.state.listeSectionsConnues.map(item=>{
      if(item.section_id === section.section_id) {
        trouve = true
        return section
      }
      return item
    })
    if(!trouve) {
      listeSectionsConnues.push(section)
    }
    this.setState({listeSectionsConnues})
  }

  activerSection = event => {
    const value = event.currentTarget?event.currentTarget.value:event
    var sections = this.state.listeSections || this.props.site.liste_sections || []
    sections = [...sections, value]
    this.setState({listeSections: sections})
  }

  desactiverSection = event => {
    const value = event.currentTarget?event.currentTarget.value:event
    var sections = this.state.listeSections || this.props.site.liste_sections || []
    sections = sections.filter(item=>item!==value)
    this.setState({listeSections: sections})
  }

  // supprimerSection = event => {
  //   var idxSection = event.currentTarget.value
  //   console.debug("Supprimer section idx: %s", idxSection)
  //   var sections = this.state.sections || this.props.site.sections || []
  //   sections = sections.filter((_, idx)=>''+idx!==idxSection)
  //   this.setState({sections})
  // }

  changerPositionSection = (idx, nouvellePosition) => {
    var sections = this.state.listeSections || this.props.site.liste_sections || []
    const section = sections[idx]
    sections = sections.filter((item, idxSection)=>idxSection!==idx)
    sections.splice(nouvellePosition, 0, section)
    this.setState({listeSections: sections})
  }

  sauvegarder = async event => {
    try {
      if(this.state.listeSections) {
        const connexionWorker = this.props.rootProps.connexionWorker,
              siteId = this.props.site.site_id,
              listeSections = this.state.listeSections
        console.debug("Sauvegarder site %s : %O", siteId, this.state.listeSections)
        const reponse = await sauvegarderSite(connexionWorker, siteId, listeSections)
        this.setState({listeSections: ''}, _=>{
          console.debug("MAJ apres update : %O", this.state)
          this.setState({confirmation: "Mise a jour du site reussie"})
        })
      }
    } catch(err) {
      console.error("Erreur : %O", err)
      this.setState({err: ''+err})
    }
  }

  clearErreur = _ => this.setState({err: ''})
  clearConfirmation = _ => this.setState({confirmation: ''})
  setErreur = err => this.setState({err})
  setConfirmation = confirmation => this.setState({confirmation})

  render() {

    var sections = this.state.sections || this.props.site.sections || []
    var sectionsRendered = null

    var section = null, sectionId = this.state.sectionId
    if(sectionId && sectionId !== true) {
      section = this.state.listeSectionsConnues.filter(item=>item.section_id===sectionId)[0]
    }

    // Afficher la section a modifier
    if(this.state.sectionId) {
      return (
        <AfficherSection sectionId={this.state.sectionId}
                         section={section}
                         typeSection={this.state.typeSection}
                         retour={_=>this.setSectionId('')}
                         site={this.props.site}
                         collectionsPubliques={this.state.collectionsPubliques}
                         forums={this.state.forums}
                         languages={this.props.languages}
                         setErreur={this.setErreur}
                         setConfirmation={this.setConfirmation}
                         insererNouvelleSection={this.insererNouvelleSection}
                         majSectionSite={this.majSectionSite}
                         rootProps={this.props.rootProps} />
      )
    }

    const listeSections = this.state.listeSections || this.props.site.liste_sections || []
    const listeSectionsConnues = this.state.listeSectionsConnues || []
    console.debug("Liste sections connues : %O", listeSectionsConnues)

    return (
      <>
        <AlertErreur err={this.state.err} clearErreur={this.clearErreur} />
        <AlertConfirmation confirmation={this.state.confirmation} clearConfirmation={this.clearConfirmation} />

        <Row className="barre-boutons-ajouter">
          <Col lg={1}>
            Ajouter
          </Col>
          <Col lg={11}>
            <ButtonGroup>
              <Button variant="secondary" onClick={this.ajouterSection} value="fichiers">Fichiers</Button>
              <Button variant="secondary" onClick={this.ajouterSection} value="album">Album</Button>
              <Button variant="secondary" onClick={this.ajouterSection} value="pages">Pages</Button>
              <Button variant="secondary" onClick={this.ajouterSection} value="forums">Forums</Button>
            </ButtonGroup>
          </Col>
        </Row>

        <h3>Sections actives</h3>
        {listeSections.map((sectionId, idx)=>{
          var section = listeSectionsConnues.filter(item=>item.section_id===sectionId)
          if(section && section.length === 1) section = section[0]
          else section = {}

          return (
            <Row>
              <Col>
                <Button variant="link" onClick={this.setSectionId} value={sectionId}>
                  <RenderChampMultilingue champ={section.entete} defaut={sectionId} />
                </Button>
              </Col>
              <Col>
                <ButtonGroup className="padding-droite">
                  <Button variant="secondary" disabled={idx===0}
                          onClick={_=>{this.changerPositionSection(idx, idx-1)}}>
                    <i className="fa fa-arrow-up"/>
                  </Button>
                  <Button variant="secondary" disabled={idx===listeSections.length-1}
                          onClick={_=>{this.changerPositionSection(idx, idx+1)}}>
                    <i className="fa fa-arrow-down"/>
                  </Button>
                  <Button onClick={this.desactiverSection}
                          value={sectionId}
                          variant="secondary"
                          disabled={!this.props.rootProps.modeProtege}>Desactiver</Button>
                </ButtonGroup>
              </Col>
            </Row>
          )
        })}

        <h3>Sections desactivees</h3>
        {listeSectionsConnues
            .filter(section=>!listeSections.includes(section.section_id))
            .sort(trierSections)
            .map((section, idx)=>{

          const nomSection = section.nom_section || section.section_id
          return (
            <Row>
              <Col>
                <Button variant="link" onClick={this.setSectionId} value={section.section_id}>
                  <RenderChampMultilingue champ={section.entete} defaut={section.section_id} />
                </Button>
              </Col>
              <Col>
                <Button onClick={this.activerSection}
                        value={section.section_id}
                        variant="secondary"
                        disabled={!this.props.rootProps.modeProtege}>Activer</Button>
              </Col>
            </Row>
          )
        })}

        <Row>
          <Col>
            <Button onClick={this.sauvegarder}
                    disabled={!this.props.rootProps.modeProtege}>Sauvegarder</Button>
          </Col>
        </Row>
      </>
    )
  }

}

function trierSections(a, b) {
  if(a===b) return 0

  const nomA = a.nom || a.section_id
  const nomB = b.nom || b.section_id

  if(nomA === nomB) return 0
  if(!nomA) return 1
  if(!nomB) return -1
  return nomA.localeCompare(nomB)
}

function AfficherSection(props) {
  const [configuration, setConfiguration] = useState('')

  const section = props.section || {type: props.typeSection}
  // console.debug("Section : %O", section)
  if(!props.sectionId) return ''

  if(!section) return <p>Chargement en cours</p>

  const sauvegarder = async event => {
    try {
      if(configuration || props.sectionId === true) {
        console.debug("Sauvegarder section, configuration %O", configuration)
        const reponse = await sauvegarderSection(
          props.rootProps.connexionWorker, props.sectionId, configuration,
          {siteId: props.site.site_id, typeSection: props.typeSection}  // Pour nouvel enregistrement
        )
        console.debug("Reponse creation/maj section : %O", reponse)
        const sectionId = reponse.section.sectionId
        if(props.sectionId === true) {
          console.debug("Ajout nouvelle section id: %s", sectionId)
          props.insererNouvelleSection(sectionId)
        }
        props.majSectionSite(reponse.section)
        props.setConfirmation("Changements sauvegarde avec succes")
      } else {
        console.debug("Aucun changement, on fait juste retour")
        props.setConfirmation("Aucun changement n'a ete apporte.")
      }
    } catch(err) {
      props.setErreur(''+err)
    }
    props.retour()
  }

  var TypeSection = null
  switch(section.type_section) {
    case 'fichiers': TypeSection = SectionFichiers; break
    case 'album': TypeSection = SectionFichiers; break
    case 'pages': TypeSection = SectionVide; break
    case 'forums': TypeSection = SectionForums; break
    default: TypeSection = TypeSectionInconnue
  }

  const idxRow = props.idxRow

  var entete = configuration.entete || section.entete
  if(!entete) {
    // Initialiser entete
    entete = {}
    props.languages.forEach(langue=>{
      entete[langue] = ''
    })
  }

  const changerChampMultilingue = event => {
    const {name, value} = event.currentTarget
    const langue = event.currentTarget.dataset.langue
    // console.debug("Changer %s[%s]= %s", name, langue, value)

    var configurationCourante = {...configuration}
    var section = props.section || {}
    var valeur = configurationCourante[name] || section[name] || {}

    // Copier valeur multilingue, remplacer valeur dans langue appropriee
    var valeurMultilingue = {...valeur}
    valeurMultilingue[langue] = value
    configurationCourante[name] = valeurMultilingue

    // console.debug("Configuration updatee : %O", configurationCourante)

    setConfiguration(configurationCourante)
  }

  const toggleCheckbox = event => {
    const name = event.currentTarget.name
    console.debug("Toggle checkbox %s", name)

    const configurationCourante = {...configuration},
          section = props.section || {}

    // Toggle valeur
    let valeur = configurationCourante[name] || section[name] || []
    if(valeur === undefined) valeur = false
    configurationCourante[name] = valeur?false:true  // Inverser value, null == false => true

    setConfiguration(configurationCourante)
  }

  const changerChampBool = event => {
    const {name, value} = event.currentTarget
    console.debug("Changer champ %s=%s", name, value)
    const configurationCourante = {...configuration},
          section = props.section || {}

    // Changer valeur bool
    configurationCourante[name] = value==='true'?true:false

    console.debug("Configuration courante : %O", configurationCourante)
    setConfiguration(configurationCourante)
  }

  const toggleListValue = event => {
    // Toggle le contenu d'un element dans une liste (ajoute ou retire l'element)
    const {name, value} = event.currentTarget

    // console.debug("Toggle checkbox %s = %s", name, value)

    const configurationCourante = {...configuration},
          section = props.section || {}

    let list = configurationCourante[name] || section[name] || []
    list = [...list]  // Shallow copy

    // Ajouter ou retirer la valeur (toggle)
    if(list.includes(value)) {list = list.filter(item=>item!==value)}
    else {list.push(value)}

    configurationCourante[name] = list

    setConfiguration(configurationCourante)
  }

  return (
    <>
      <h2>Section {section.type_section}</h2>
      <Form.Group>
        <Form.Label>Titre affiche de la section</Form.Label>
        <ChampInputMultilingue languages={props.languages}
                               name="entete"
                               values={entete}
                               changerChamp={changerChampMultilingue} />
      </Form.Group>

      <TypeSection section={section}
                   configuration={configuration}
                   changerChampBool={changerChampBool}
                   toggleListValue={toggleListValue}
                   {...props} />

      <Form.Row>
        <Button onClick={sauvegarder}>Sauvegarder</Button>
        <Button onClick={props.retour} variant="secondary">Annuler</Button>
      </Form.Row>

    </>
  )
}

function TypeSectionInconnue(props) {
  return <p>Type section non geree</p>
}

function SectionFichiers(props) {

  const section = props.section,
        configuration = props.configuration  // valeurs en memoire

  let toutesCollectionsInclues = null
  if(configuration.toutes_collections !== undefined) {
    toutesCollectionsInclues = configuration.toutes_collections?true:false
  } else {
    toutesCollectionsInclues = section.toutes_collections?true:false
  }

  var collectionsSelectionnees = configuration.collections || section.collections || []

  var collectionsPubliques = ''
  if(!toutesCollectionsInclues && props.collectionsPubliques) {
    collectionsPubliques = props.collectionsPubliques.map(item=>{
      return (
        <Form.Row key={item.uuid}>
          <Form.Check id={"collections-" + item.uuid} key={item.uuid}
                      type="checkbox"
                      label={item.nom_collection}
                      name="collections"
                      value={item.uuid}
                      checked={collectionsSelectionnees.includes(item.uuid)}
                      onChange={props.toggleListValue} />
        </Form.Row>
      )
    })
  }

  return (
    <>
      <Form.Row>
        <Form.Group as={Col} md={6} lg={5}>
          <Form.Label>Choix des collections de fichiers</Form.Label>
          <Form.Check id={"collections-toutes"}
                      type="radio"
                      label={"Toutes les collections publiques" + (props.site.securite==='2.prive'?' et privees':'')}
                      name="toutes_collections"
                      checked={toutesCollectionsInclues}
                      value="true"
                      onChange={props.changerChampBool} />
          <Form.Check id={'collections-selectionnees'}
                      type="radio"
                      label="Collections selectionnees uniquement"
                      name="toutes_collections"
                      checked={!toutesCollectionsInclues}
                      value="false"
                      onChange={props.changerChampBool} />
        </Form.Group>

        {!toutesCollectionsInclues?
          <Form.Group as={Col} md={6} lg={7}>
            <Form.Label>Selectionner collections de fichiers a publier</Form.Label>
            {collectionsPubliques}
          </Form.Group>
          :''
        }

      </Form.Row>

    </>
  )

}

function SectionVide(props) {
  return ''
}

function SectionForums(props) {

  const section = props.section,
        configuration = props.configuration

  var forumsSelectionnes = configuration.liste_forums || section.liste_forums || []
  const niveauxSecurite = ['1.public']
  if(props.site.securite==='2.prive') niveauxSecurite.push('2.prive')

  let tousForumsInclus = null
  if(configuration.tous_forums !== undefined) {
    tousForumsInclus = configuration.tous_forums?true:false
  } else {
    tousForumsInclus = section.tous_forums?true:false
  }

  var forumsDisponibles = ''
  if(!tousForumsInclus && props.forums) {
    forumsDisponibles = props.forums
      .filter(item=>niveauxSecurite.includes(item.securite))
      .map(item=>{
      return (
        <Form.Row key={item.forum_id}>
          <Form.Check id={"forum-" + item.forum_id} key={item.forum_id}
                      type="checkbox"
                      label={item.nom}
                      name="liste_forums"
                      value={item.forum_id}
                      checked={forumsSelectionnes.includes(item.forum_id)}
                      onChange={props.toggleListValue} />
        </Form.Row>
      )
    })
  }

  return (
    <>
      <Form.Row>
        <Form.Group as={Col} md={6} lg={5}>
          <Form.Label>Choix des forums</Form.Label>
          <Form.Check id={"forums--toutes"}
                      type="radio"
                      label={"Tous les forums publics" + (props.site.securite==='2.prive'?' et prives':'')}
                      name="tous_forums"
                      checked={tousForumsInclus}
                      value="true"
                      onChange={props.changerChampBool} />
          <Form.Check id={'forums--selectionnes'}
                      type="radio"
                      label="Forums selectionnes uniquement"
                      name="tous_forums"
                      checked={!tousForumsInclus}
                      value="false"
                      onChange={props.changerChampBool} />
        </Form.Group>

        {!tousForumsInclus?
          <Form.Group as={Col} md={6} lg={7}>
            <Form.Label>Selectionner forums a publier</Form.Label>
            {forumsDisponibles}
          </Form.Group>
          :''
        }

      </Form.Row>

    </>
  )

}

function AlertErreur(props) {
  return (
    <Alert variant="danger" show={props.err !== ''} onClose={props.clearErreur} dismissible>
      <Alert.Heading>Erreur</Alert.Heading>
      <pre>{'' + props.err}</pre>
    </Alert>
  )
}

function AlertConfirmation(props) {
  return (
    <Alert variant="success" show={props.confirmation !== ''} onClose={props.clearConfirmation} dismissible>
      <Alert.Heading>Operation completee</Alert.Heading>
      <pre>{'' + props.confirmation}</pre>
    </Alert>
  )
}

async function chargerForums(wsa, setForums) {
  const forums = await wsa.requeteForums()
  setForums(forums)
  console.debug("Forums charges : %O", forums)
}

async function chargerSectionsConnues(wsa, siteId, setSectionsConnues) {
  const listeSections = await wsa.requeteSectionsSite(siteId)
  console.debug("Sections pour site %s = %O", siteId, listeSections)
  setSectionsConnues(listeSections)
}

async function sauvegarderSite(connexionWorker, siteId, listeSections) {
  // Conserver changements au formulaire
  // const domaineAction = 'Publication.majSite'
  const transaction = {
    site_id: siteId,
    liste_sections: listeSections,
  }

  // const signateurTransaction = this.props.rootProps.signateurTransaction
  // await signateurTransaction.preparerTransaction(transaction, domaineAction)
  const reponse = await connexionWorker.majSite(transaction)
}

async function sauvegarderSection(connexionWorker, sectionId, configuration, opts) {
  const transaction = {...configuration}
  if(sectionId && sectionId !== true) {
    // Site existant
    transaction.section_id = sectionId
  } else {
    // Nouveau site
    transaction.type_section = opts.typeSection
    transaction.site_id = opts.siteId
  }
  return connexionWorker.majSection(transaction)
}

function RenderChampMultilingue(props) {
  const champ = props.champ
  if(champ) {
    const langues = Object.keys(champ)
    langues.sort()
    return langues.map(l=>''+l+':'+champ[l]).join('/')
  } else {
    return props.defaut || ''
  }
  return ''
}
