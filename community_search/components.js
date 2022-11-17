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

    this.state = Object.assign({}, props, {
      page: 0, 
      pageSize: 10
    });
  }

  render(){
    const thisComponent = this;

    const { communities, filterOnline, filterCity, filterState, filterEventName, filterOrganizer, page, pageSize } = this.state;
    
    const matchingListItems = communities
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
          return e(Community, { key: index, community: community });
        }else{
          return null;
        }
      })
      .reduce((accumulator, community) => {
        if(community !== null){
          accumulator.push(community);
        }
        return accumulator;
      }, []);

    const listItems = matchingListItems
      .map((communityElement, index) => {
        if(index >= page*pageSize && index < (page+1)*pageSize) {
          return communityElement;
        }else{
          return null;
        }
      })
      .reduce((accumulator, communityElement) => {
        if(communityElement !== null){
          accumulator.push(communityElement);
        }
        return accumulator;
      }, []);

    const pageCount = Math.ceil(matchingListItems.length/pageSize);

    const pages = (pageCount) => {
      let spans = [];
      for(let p = 0; p < pageCount; p++){
        spans.push(
          e(
            'a', 
            { 
              className: `king-list-pager-page ${p === page ? 'selected' : ''}`, 
              href: '#',
              key: p+1,
              onClick: (event) => {              
                thisComponent.setState((state, props) => {
                  return Object.assign({}, state, {
                    page: p
                  });                
                });
              }
            }, 
            p+1
          )
        );
      }
      return spans;
    };

    return e(
      'div', 
      { className: 'king-list' },      
      e('div', { className: 'king-list-items' }, listItems ),
      e(
        'div', 
        { className: `king-empty-list-message ${listItems.length === 0 ? 'show' : 'hide' }` }, 
        'No communities match your search criteria.'
      ),
      e(
        'div', 
        { className: 'king-list-pager' },
        e(
          'a', 
          { 
            className: 'king-list-pager-prev-page-button', 
            dangerouslySetInnerHTML: { '__html': '&laquo;' },
            href: '#',
            onClick: (event) => {              
              thisComponent.setState((state, props) => {
                return Object.assign({}, state, {
                  page: thisComponent.state.page === 0 ? pageCount-1 : thisComponent.state.page - 1
                });                
              });
            }
          }
        ),
        pages(pageCount),
        e(
          'a', 
          { 
            className: 'king-list-pager-next-page-button', 
            dangerouslySetInnerHTML: { '__html': '&raquo;' },
            href: '#',
            onClick: (event) => {
              thisComponent.setState((state, props) => {
                return Object.assign({}, state, {
                  page: (thisComponent.state.page + 1)%pageCount
                });                
              });
            }
          }
        )
      )
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

/**
 * Triggers action after user stops typing
 */
class TriggerActionInput extends React.Component {

  constructor(props){
    super(props);
    const dummyFunction = () => console.log('do nothing');
    this.state = {
      inputProps: props.inputProps || {},
      onTrigger: props.onTrigger || dummyFunction,
      triggerAfterMs: props.triggerAfterMs || 250      
    };
  }
  render(){
    const thisComponent = this;
    const { inputProps, onTrigger, triggerAfterMs } = this.state;
    const combinedProps = Object.assign({}, inputProps, {
      onKeyDown: (event) => {
        if(thisComponent.timeoutId !== null || thisComponent.timeoutId !== undefined){
          clearTimeout(thisComponent.timeoutId);
        }
        thisComponent.timeoutId = setTimeout(onTrigger, triggerAfterMs);
      },
    });
    return e('input', combinedProps);
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

    return e(
      'div', 
      { className: 'king-search' },
      e(
        'ul', 
        { 
          className: 'king-filter-bar'          
        },        
        e(
          'li', 
          {},
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
            ' Meets Online'
          ),    
        ),
        e(
          'li',
          {},
          e('span',
            { className: `king-filter-offline ${ thisComponent.state.filterOnline ? 'hide' : 'show' }`},
            e(
              TriggerActionInput, 
              { 
                inputProps: {
                  className: 'king-filter-city',
                  placeholder: 'City',                
                  ref: this.filterCityInput
                },
                onTrigger: search                
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
        ),
        e(
          'li', 
          {},
          e(
            TriggerActionInput, 
            { 
              inputProps: {
                className: 'king-filter-event',
                placeholder: 'Event',              
                ref: this.filterEventInput
              },
              onTrigger: search              
            }
          )
        ),
        e(
          'li',
          {},
          e(
            TriggerActionInput, 
            { 
              inputProps: {
                className: 'king-filter-organizer',
                placeholder: 'Organizer',
                ref: this.filterOrganizerInput
              },
              onTrigger: search              
            }
          )
        ),
        e('li', {}, ' ')
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