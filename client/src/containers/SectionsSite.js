import React from 'react'
import {Row, Col, Button, ButtonGroup, Form, FormControl, InputGroup, Alert, Nav} from 'react-bootstrap'

import {ChampInputMultilingue} from './InfoSite'

export default class SectionsSite extends React.Component {

  state = {
    sections: '',

    collectionsPubliques: '',
    forums: '',

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
  }

  ajouterSection = event => {
    var typeSection = event.currentTarget.value
    var sections = this.state.sections || this.props.site.sections || []
    sections = [...sections]  // Shallow copy

    const section = {type: typeSection}
    sections.push(section)
    this.setState({sections})
  }

  supprimerSection = event => {
    var idxSection = event.currentTarget.value
    console.debug("Supprimer section idx: %s", idxSection)
    var sections = this.state.sections || this.props.site.sections || []
    sections = sections.filter((_, idx)=>''+idx!==idxSection)
    this.setState({sections})
  }

  changerChampMultilingue = event => {
    const {name, value} = event.currentTarget
    const langue = event.currentTarget.dataset.langue
    const idxRow = event.currentTarget.dataset.row

    // console.debug("Changement champ %s, row:%s, langue:%s = %s", name, idxRow, langue, value)

    var sections = this.state.sections || this.props.site.sections
    sections = [...sections]  // Shallow copy

    // Copier row
    var row = {...sections[idxRow]}
    sections[idxRow] = row

    // Copier valeur multilingue, remplacer valeur dans langue appropriee
    var valeurMultilingue = {...row[name]}
    valeurMultilingue[langue] = value
    row[name] = valeurMultilingue

    this.setState({sections})
  }

  toggleCheckbox = event => {
    const name = event.currentTarget.name
    const idxRow = event.currentTarget.dataset.row
    // console.debug("Toggle checkbox %s, row:%s", name, idxRow)

    var sections = this.state.sections || this.props.site.sections
    sections = [...sections]  // Shallow copy

    // Copier row
    var row = {...sections[idxRow]}
    sections[idxRow] = row

    row[name] = row[name]?false:true  // Inverser value, null == false => true

    this.setState({sections}, _=>{console.debug("Status updated : %O", this.state)})
  }

  toggleListValue = event => {
    // Toggle le contenu d'un element dans une liste (ajoute ou retire l'element)
    const {name, value} = event.currentTarget
    const idxRow = event.currentTarget.dataset.row

    console.debug("Toggle checkbox %s, row:%s = %s", name, idxRow, value)

    var sections = this.state.sections || this.props.site.sections
    sections = [...sections]  // Shallow copy

    // Copier row
    var row = {...sections[idxRow]}
    sections[idxRow] = row

    var list = row[name] || []
    if(list.includes(value)) {
      // Retirer la valeur
      list = list.filter(item=>item!==value)
    } else {
      // Ajouter la valeur
      list.push(value)
    }

    row[name] = list

    this.setState({sections}, _=>{console.debug("Status updated : %O", this.state)})
  }

  changerPositionSection = (idx, nouvellePosition) => {
    var sections = this.state.sections || this.props.site.sections || []
    const section = sections[idx]
    sections = sections.filter((item, idxSection)=>idxSection!==idx)
    sections.splice(nouvellePosition, 0, section)
    this.setState({sections})
  }

  sauvegarder = async event => {
    if(this.state.sections) {
      console.debug("Sauvegarder : %O", this.state.sections)

      // Conserver changements au formulaire
      const domaineAction = 'Publication.majSite'
      var transaction = {
            site_id: this.props.siteId,
            sections: this.state.sections,
          }

      try {
        // const signateurTransaction = this.props.rootProps.signateurTransaction
        // await signateurTransaction.preparerTransaction(transaction, domaineAction)
        const webWorker = this.props.rootProps.chiffrageWorker
        transaction = await webWorker.formatterMessage(transaction, domaineAction)
        console.debug("Maj site %s, Transaction a soumettre : %O", this.props.siteId, transaction)

        const wsa = this.props.rootProps.websocketApp
        const reponse = await wsa.majSite(transaction)

        this.setState({sections: ''}, _=>{
          console.debug("MAJ apres update : %O", this.state)
          this.setState({confirmation: "Mise a jour du site reussie"})
        })
      } catch (err) {
        this.setState({err})
      }
    } else {
      console.debug("Rien a sauvegarder")
    }
  }

  clearErreur = _ => this.setState({err: ''})
  clearConfirmation = _ => this.setState({confirmation: ''})

  render() {

    var sections = this.state.sections || this.props.site.sections || []
    var sectionsRendered = null

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

        {sections.map((section, idxRow)=>
          <AfficherSection key={idxRow} idxRow={idxRow}
                           configuration={section}
                           sections={sections}
                           changerChampMultilingue={this.changerChampMultilingue}
                           toggleCheckbox={this.toggleCheckbox}
                           toggleListValue={this.toggleListValue}
                           collectionsPubliques={this.state.collectionsPubliques}
                           forums={this.state.forums}
                           supprimerSection={this.supprimerSection}
                           changerPositionSection={this.changerPositionSection}
                           {...this.props} />
        )}

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

function AfficherSection(props) {
  var TypeSection = null

  switch(props.configuration.type) {
    case 'fichiers': TypeSection = SectionFichiers; break
    case 'album': TypeSection = SectionFichiers; break
    case 'pages': TypeSection = SectionVide; break
    case 'forums': TypeSection = SectionForums; break
    default: TypeSection = TypeSectionInconnue
  }

  const idxRow = props.idxRow

  var entete = props.configuration.entete
  if(!entete) {
    // Initialiser entete
    entete = {}
    props.languages.forEach(langue=>{
      entete[langue] = ''
    })
  }

  return (
    <>
      <h2>{idxRow+1}. Section {props.configuration.type}</h2>
      <Form.Group>
        <Form.Label>Titre affiche de la section</Form.Label>
        <ChampInputMultilingue languages={props.languages}
                               name="entete"
                               values={entete}
                               idxRow={idxRow}
                               changerChamp={props.changerChampMultilingue} />
      </Form.Group>

      <TypeSection {...props} />

      <Form.Group>
        <Form.Label>Actions sur la section</Form.Label>
        <Form.Row>
          <ButtonGroup>
            <Button variant="secondary" disabled={idxRow===0}
                    onClick={_=>{props.changerPositionSection(idxRow, idxRow-1)}}>
              <i className="fa fa-arrow-up"/>
            </Button>
            <Button variant="secondary" disabled={idxRow===props.sections.length-1}
                    onClick={_=>{props.changerPositionSection(idxRow, idxRow+1)}}>
              <i className="fa fa-arrow-down"/>
            </Button>
          </ButtonGroup>
          {' '}
          <Button onClick={props.supprimerSection}
                  value={idxRow}
                  variant="danger"
                  disabled={!props.rootProps.modeProtege}>Supprimer section fichiers</Button>
        </Form.Row>
      </Form.Group>
    </>
  )
}

function TypeSectionInconnue(props) {
  return <p>Type section non geree</p>
}

function SectionFichiers(props) {

  const configuration = props.configuration,
        idxRow = props.idxRow

  var toutesCollectionsInclues = configuration.toutes_collections?true:false
  var collectionsSelectionnees = configuration.collections || []

  var collectionsPubliques = ''
  if(!toutesCollectionsInclues && props.collectionsPubliques) {
    collectionsPubliques = props.collectionsPubliques.map(item=>{
      return (
        <Form.Row key={item.uuid}>
          <Form.Check id={["collections-", idxRow, item.uuid].join('-')} key={item.uuid}
                      type="checkbox"
                      label={item.nom_collection}
                      name="collections"
                      value={item.uuid}
                      checked={collectionsSelectionnees.includes(item.uuid)}
                      data-row={idxRow}
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
          <Form.Check id={"collections-" + idxRow + "-toutes"}
                      type="radio"
                      label={"Toutes les collections publiques" + (props.site.securite==='2.prive'?' et privees':'')}
                      name="toutes_collections"
                      checked={toutesCollectionsInclues}
                      data-row={idxRow}
                      onChange={props.toggleCheckbox} />
          <Form.Check id={"collections-" + idxRow + '-selectionnees'}
                      type="radio"
                      label="Collections selectionnees uniquement"
                      name="toutes_collections"
                      checked={!toutesCollectionsInclues}
                      data-row={idxRow}
                      onChange={props.toggleCheckbox} />
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

  const configuration = props.configuration,
        idxRow = props.idxRow

  var tousForumsInclus = configuration.tous_forums?true:false
  var forumsSelectionnes = configuration.listeForums || []

  var forumsDisponibles = ''
  if(!tousForumsInclus && props.forums) {
    forumsDisponibles = props.forums.map(item=>{
      return (
        <Form.Row key={item.forum_id}>
          <Form.Check id={"forum-" + item.forum_id} key={item.forum_id}
                      type="checkbox"
                      label={item.nom}
                      name="listeForums"
                      value={item.forum_id}
                      checked={forumsSelectionnes.includes(item.forum_id)}
                      data-row={idxRow}
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
          <Form.Check id={"forums-" + idxRow + "-toutes"}
                      type="radio"
                      label={"Tous les forums publics" + (props.site.securite==='2.prive'?' et prives':'')}
                      name="tous_forums"
                      checked={tousForumsInclus}
                      data-row={idxRow}
                      onChange={props.toggleCheckbox} />
          <Form.Check id={"forums-" + idxRow + '-selectionnes'}
                      type="radio"
                      label="Forums selectionnes uniquement"
                      name="tous_forums"
                      checked={!tousForumsInclus}
                      data-row={idxRow}
                      onChange={props.toggleCheckbox} />
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
