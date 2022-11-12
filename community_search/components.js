'use strict';

const e = React.createElement;

class Community extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      location: {
        city: props.community.online ? null : props.community.city,
        state: props.community.online ? null : props.community.state,
        online: props.community.online
      },
      eventName: props.community.eventName || 'Title',
      organizer: props.community.organizer || 'Organizer',
      description: props.community.description || 'Description'
    };
  }

  render(){
    const { location, eventName, organizer, description } = this.state;
    
    const eventLocation = location.online ? 'Online' : `${location.city}, ${location.state}`;

    const cleanDescriptionHtml = DOMPurify.sanitize(description, {
      USE_PROFILES: { html: true }
    });

    return e(
      'div',
      { className: 'king-item' },
      e('div', { className: 'king-header' },
        e('span', { className: 'king-location' }, eventLocation),
        e('span', { className: 'king-spacer' }, '|'),
        e('span', { className: 'king-title' }, eventName),
        e('span', { className: 'king-spacer' }, '|'),
        e('span', { className: 'king-organizer' }, organizer)
      ),
      e('div', { className: 'king-description', dangerouslySetInnerHTML: { '__html': cleanDescriptionHtml } })
    );
  }
}

class CommunityList extends React.Component {

  constructor(props){
    super(props);

    this.state = Object.assign({}, props);
  }

  render(){
    const thisComponent = this;

    const { communities, filterOnline, filterCity, filterState, filterEventName, filterOrganizer } = this.state;
    
    const listItems = communities
      .map((community, index) => {

        let matches = true;

        if (filterOnline !== undefined && filterOnline && !community.online) {
          matches = false;          
        }

        if (filterCity !== undefined && filterCity.length > 0 && ((community.city !== null && community.city.toLowerCase().indexOf(filterCity.toLowerCase()) < 0) || community.online)){          
          matches = false;          
        }

        if (filterState !== undefined && filterState.length > 0 && community.state !== filterState){
          matches = false;
        }

        if (filterEventName !== undefined && filterEventName.length > 0 && community.eventName.toLowerCase().indexOf(filterEventName.toLowerCase()) < 0 ){
          matches = false;
        }

        if (filterOrganizer !== undefined && filterOrganizer.length > 0 && community.organizer.toLowerCase().indexOf(filterOrganizer.toLowerCase()) < 0 ){
          matches = false;
        }

        if(matches){
          return e(Community, { key: index, community: community })
        }else{
          return null;
        }
      })
      .reduce((acc, c) => {
        if(c != null){
          acc.push(c);
        }
        return acc;
      }, []);

    return e(
      'div', 
      { className: 'king-list' },      
      listItems,
      e('div', { className: `king-empty-list-message ${listItems.length === 0 ? 'show' : 'hide' }` }, 'No communities match your search criteria.')
    );
  }
}

class USStatesSelect extends React.Component {

  constructor(props){
    super(props);
    this.state = Object.assign({}, props);
  }

  render(){
    const { states } = this.state;
    const options = [];
    states.forEach((state, index) => {
      options.push(e('option', { key: index+1, value: state }, state));
    });
    return e(
      'select', 
      { 
        className: 'king-select-state',
        onChange: this.state.onChange
      },
      e('option', { key: 0, value: '', defaultValue: 'selected' }, 'State'),
      options
    );
  }
}

class CommunitySearch extends React.Component {

  constructor(props){
    super(props);
    
    this.state = Object.assign({}, props); 

    this.filterOnlineCheckbox = React.createRef();
    this.filterCityInput = React.createRef();
    this.filterStateSelect = React.createRef();
    this.filterEventInput = React.createRef();
    this.filterOrganizerInput = React.createRef();
    this.communityList = React.createRef();
  }

  componentDidUpdate(prevProps, prevState, snapshot){

    const communityList = this.communityList.current;
    const currState = this.state;

    [
      'filterOnline', 
      'filterCity', 
      'filterState', 
      'filterEventName', 
      'filterOrganizer'
    ].forEach((attr) => {
      if(prevState[attr] !== currState[attr]){
        communityList.setState((state, props) => {
          let source = {};
          source[attr] = currState[attr];
          return Object.assign({}, state, source);
        });
      }
    });    
  }

  render(){

    const thisComponent = this;
    const { communities, filterOnline, filterCity } = this.state;

    // get states where events are taking place
    const states = communities
      .filter((community) => community.state !== null)
      .map((community) => community.state)
      .reduce((acc, state) => {
        acc.add(state);
        return acc;
      }, new Set());

    const search = () => {
      thisComponent.setState((state, props) => {
        const nextState = Object.assign({}, state, {
          filterOnline: thisComponent.filterOnlineCheckbox.current.checked,          
          filterCity: thisComponent.filterCityInput.current.value,
          filterState: thisComponent.filterStateSelect.current.value,
          filterEventName: thisComponent.filterEventInput.current.value,
          filterOrganizer: thisComponent.filterOrganizerInput.current.value
        });
        return nextState;
      });
    };

    const searchOnEnter = (event) => {
      if(event.keyCode === 13){
        search();
      }
    };

    return e(
      'div', 
      { className: 'king-search' },
      e('div', 
        { 
          className: 'king-filter-bar'          
        },
        e('span', 
          { className: 'king-filter-online'}, 
          e(
            'input', 
            { 
              className: 'king-filter-online-input', 
              type: 'checkbox', 
              ref: this.filterOnlineCheckbox,
              onChange: (event) => {
                thisComponent.setState((state, props) => {
                  const nextState = Object.assign({}, state, {
                    filterOnline: event.target.checked
                  });
                  return nextState;
                });
              }
            }
          ),
          e('label', { className: 'king-filter-online-label', htmlFor: 'onlineCheckbox' }, 'Online')        
        ),        
        e('span',
          { className: `king-filter-offline ${ thisComponent.state.filterOnline ? 'hide' : 'show' }`},
          e(
            'input', 
            { 
              className: 'king-filter-city', 
              type: 'text', 
              onKeyDown: searchOnEnter,
              placeholder: 'City',
              ref: this.filterCityInput
            }
          ),
          e(
            USStatesSelect, 
            { 
              states: states, 
              onChange: (event) => {
                thisComponent.setState((state, props) => {
                  const nextState = Object.assign({}, state, {
                    filterState: event.target.value
                  });
                  return nextState;
                });
              },
              ref: this.filterStateSelect
            }
          )
        )
        ,
        e(
          'input', 
          { 
            className: 'king-filter-event', 
            type: 'text', 
            placeholder: 'Event',
            onKeyDown: searchOnEnter,
            ref: this.filterEventInput
          }
        ),
        e(
          'input', 
          { 
            className: 'king-filter-organizer', 
            type: 'text', 
            placeholder: 'Organizer',
            onKeyDown: searchOnEnter,
            ref: this.filterOrganizerInput
          }
        ),
        e(
          'button', 
          { 
            className: 'king-filter-search-button',
            onClick: (event) => {
              search();
            }
          },
          'Search'
        )
      ),
      e(
        CommunityList, 
        { 
          communities: communities,
          filterOnline: filterOnline,
          filterCity: filterCity,
          ref: this.communityList
        }
      )
    );
  }
}

// get list of communities
const communitiesJson = 'communities.json';
window.fetch(communitiesJson)
  .then((res) => res.json())
  .then(
    (result) => {
      // render community list in element with id 'root'
      const domContainer = document.querySelector('#root');
      const root = ReactDOM.createRoot(domContainer);
      root.render(e(CommunitySearch, result));
    },
    (error) => {
      console.log(error);
    }
  );