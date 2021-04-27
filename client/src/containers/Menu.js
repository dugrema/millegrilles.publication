import React from 'react'
import { Nav, Navbar, NavLink, NavItem, Dropdown } from 'react-bootstrap';

import { Trans } from 'react-i18next';

export function Menu(props) {

  let boutonProtege
  if(props.rootProps.modeProtege) {
    boutonProtege = <i className="fa fa-lg fa-lock protege"/>
  } else {
    boutonProtege = <i className="fa fa-lg fa-unlock"/>
  }

  var menuItems = props.sousMenuApplication

  return (
    <Navbar collapseOnSelect expand="md" bg="info" variant="dark" fixed="top">
      <Navbar.Brand href='/'><i className="fa fa-home"/></Navbar.Brand>
      <Navbar.Toggle aria-controls="responsive-navbar-menu" />
      <Navbar.Collapse id="responsive-navbar-menu">
        <MenuItems section={props.section}
                   changerPage={props.changerPage} />
        <Nav className="justify-content-end">
          <Nav.Link onClick={props.rootProps.toggleProtege}>{boutonProtege}</Nav.Link>
          <Nav.Link onClick={props.rootProps.changerLanguage}><Trans>menu.changerLangue</Trans></Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export class MenuItems extends React.Component {

  render() {

    return (
      <Nav className="mr-auto" activeKey={this.props.section} onSelect={this.props.changerPage}>

        <Nav.Item>
          <Nav.Link eventKey=''>
            <Trans>menu.Publication</Trans>
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link eventKey='listeSites'>
            <Trans>menu.Sites</Trans>
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link eventKey='cdnConfig'>
            <Trans>menu.CDNConfig</Trans>
          </Nav.Link>
        </Nav.Item>

        <Nav.Item>
          <Nav.Link eventKey='pagesSites'>
            <Trans>menu.PagesSites</Trans>
          </Nav.Link>
        </Nav.Item>

      </Nav>
    )
  }
}
