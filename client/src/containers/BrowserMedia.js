import React from 'react'
import {ListeFichiers} from './AfficherMedia'
import {Row, Col, Button, Nav, Modal} from 'react-bootstrap'

export default class BrowserMediaGrosfichiers extends React.Component {

  state = {
    collections: '',
    collectionSelectionnee: '',
    fichierSelectionne: '',
  }

  componentDidMount() {
    this.chargerListeCollections()
  }

  async chargerListeCollections() {
    console.debug("Charger liste des collections grosfichiers")
    const connexionWorker = this.props.rootProps.connexionWorker
    const collections = await connexionWorker.getCollections()
    this.setState({collections}, _=>{
      console.debug("Collections de grosFichiers : %O", this.state)
    })
  }

  setCollectionSelectionnee = collection => {
    if(collection && collection.currentTarget) {
      collection = collection.currentTarget.value
    }
    console.debug("Set collection selectionnee : %O", collection)
    this.setState({collectionSelectionnee: collection || ''})
  }

  setFichierSelectionne = fichier => {
    console.debug("Fichier selectionne : %O", fichier)
    this.setState({fichierSelectionne: fichier})
  }

  selectionner = event => {
    this.props.selectionner(this.state.fichierSelectionne)
    this.setState({collectionSelectionnee: '', fichierSelectionne: ''})
    this.props.hide()
  }

  render() {

    var contenu = ''
    if(this.state.collectionSelectionnee) {
      var collection = this.props.collectionPersonnelle
      if(this.state.collectionSelectionnee !== 'personnelle') {
        collection = this.state.collections.filter(item => item.uuid === this.state.collectionSelectionnee)[0]
      }
      contenu = <ListeMedia collection={collection}
                            rootProps={this.props.rootProps}
                            setFichierSelectionne={this.setFichierSelectionne}
                            back={this.setCollectionSelectionnee} />
    } else {
      contenu = <ListeCollections collections={this.state.collections}
                                  setCollectionSelectionnee={this.setCollectionSelectionnee} />
    }

    return (
      <Modal show={this.props.show} onHide={this.props.hide} size="lg" scrollable={true}>
        <Modal.Header closeButton>
          <Modal.Title>Selectionner un contenu media</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {contenu}
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={this.selectionner}>Selectionner</Button>
          <Button variant="secondary" onClick={this.props.hide}>Annuler</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

function ListeCollections(props) {
  if(!props.collections) return ''

  const collections = props.collections.map(item=>{
    return (
      <Nav.Item key={item.uuid}>
        <Nav.Link eventKey={item.uuid}>{item.nom_collection}</Nav.Link>
      </Nav.Item>
    )
  })

  return (
    <>
      <h3>Collections disponibles</h3>
      <Nav variant="pills" className="flex-column" onSelect={props.setCollectionSelectionnee}>
        <Nav.Item key='personnelle'>
          <Nav.Link eventKey='personnelle'>Personnelle</Nav.Link>
        </Nav.Item>
        {collections}
      </Nav>
    </>
  )
}

class ListeMedia extends React.Component {
  state = {
    fichiers: '',
    nombreAffiches: 20,
    uuidFichierSelectionne: '',
  }

  componentDidMount() {
    this.chargerListeFichiers()
  }

  setFichierSelectionne = event => {
    const uuidFichier = event.currentTarget.dataset.uuid
    console.debug("uuid fichier selectionne : %s", uuidFichier)
    this.setState({uuidFichierSelectionne: uuidFichier})

    var fichier = this.state.fichiers.filter(item=>item.uuid===uuidFichier).pop()
    this.props.setFichierSelectionne(fichier)
  }

  chargerListeFichiers = async _ => {
    var fichiers = '', permission = ''
    if(this.props.collection.fichiers) {
      // Fichiers deja inclus
      fichiers = this.props.collection.fichiers
      permission = this.props.collection.permission
    } else {
      console.debug("Charger liste fichiers de la collection %s", this.props.collection.uuid)
      const connexionWorker = this.props.rootProps.connexionWorker
      const contenuCollection = await connexionWorker.getContenuCollection(this.props.collection.uuid)
      console.debug("Contenu collection : %O", contenuCollection)
      fichiers = contenuCollection.documents
    }
    this.setState({fichiers, permission}, _=>{console.debug('State : %O', this.state)})
  }

  render() {
    return (
      <>
        <h2>Collection {this.props.collection.nom_collection}</h2>

        <Row>
          <Col>
            <Button onClick={this.props.back}>Back</Button>
          </Col>
        </Row>

        <ListeFichiers fichiers={this.state.fichiers}
                       permission={this.state.permission}
                       nombresAffiches={this.state.nombreAffiches}
                       onClick={this.setFichierSelectionne}
                       uuidSelectionne={this.state.uuidFichierSelectionne}
                       rootProps={this.props.rootProps}
                       usePreview={true} />
      </>
    )
  }
}
