var ui = ( function( p ) {

    var infoTmpl = '<a title="close" href="#" id="close-version-info" class="pull-right"><i class="icon-remove-sign"></i></a>' +
                   '<h4><%= title %> <small><%= yearString %></small></h4>' +
                   '<h5><%= genre %> <small>amount translated: <%= quantity %></small></h5>' +
                   '<div class="versionInfoBody"><%= historyString %></div>' +
                   '<div class="vvvLink"><small><a href="<%= link %>">View on VVV</a></small></div>' +
                   '<h6>Description</h6>' +
                   '<div class="description-wrapper"><div id="version-description"><small><%= description %></small></div></div>';

    var authorShipTmpl = '<dl class="dl-horizontal authors">' +
                            '<dt><span class="label label-inverse"><%= writtenName %></span></dt>' +
                                '<dd>' + 
                                    '<p><small>written by <%= authorsString %></small></p>' + 
                                    '<%= translatorsString %>' +
                                    '<%= editorsString %>' +
                                '</dd>' +
                         '</dl>' + 
                         '<%= rewrittenString %>';

    var translatorsTmpl = '<p><small>translated by <%= translatorsString %></small></p>';
    var editorsTmpl = '<p><small>edited by <%= editorsString %></small></p>';
    var rewrittenTmpl = '<dl class="dl-horizontal authors">' +
                            '<dt><span class="label label-inverse"><%= name %></span></dt><dd><smalL>rewritten</small></dd>' +
                        '</dl>';
    var publishedTmpl = '<dl class="dl-horizontal published">' +
                            '<dt><%= pubLocationNames %></dt><dd><small>published by <%= publisher %></small></dd>' +
                        '</dl>';

    var versionListTmpl = '<li><a href="#" data-versionid="<%= id %>"><%= name %></a></li>';
    var versionTitleTmpl = '<%= name %> <b class="caret"></b>';
    var authorListTmpl = '<li><a href="#"><%= name %></a></li>';

    var legendTmpl = '<p><small>Map: <%= year %></small></p>';

    p.createAuthorList = function( versions ) {
        authors = _.flatten( _.pluck( versions, 'authors' ) );
        male = _.filter( authors, function( author ) { return author.gender == 'm'; } );
        female = _.filter( authors, function( author ) { return author.gender == 'f'; } );

        var $al = $( '#authorList' );
        // female authors
        $al.append( '<li class="dropdown-submenu"><a href="#">&#9792;</a><ul class="dropdown-menu"></ul></li>' );
        $fal = $( '#authorList > li > ul' );
        _.each( female, function( fauthor ) {
            $fal.append( _.template( authorListTmpl, fauthor ) );
        });
        // male authors
        $al.append( '<li class="dropdown-submenu"><a href="#">&#9794;</a><ul class="dropdown-menu"></ul></li>' );
        $mal = $( '#authorList > li > ul:last' );
        _.each( male, function( mauthor ) {
            $mal.append( _.template( authorListTmpl, mauthor ) );
        });
    };

    p.createVersionList = function( versions ) {

        var grouped = _.groupBy( versions, function( version ) { return data.century( version.year ); } );
        var menuString = '';
        _.each( grouped, function( group, key ) {
            menuString += '<li class="dropdown-submenu"><a href="#">' + util.upperCaseNumbers( key ) + 's</a><ul class="dropdown-menu">';
            _.each( group, function( version ) {
                menuString += _.template( versionListTmpl, version );
            });
            menuString += '</ul></li>';
        });

        $( '#versionList' ).append( menuString );
    };

    p.showVersionInfo = function( version ) {
        $( '#versionInfo .label' ).unbind( 'click' );

        $( '#versionInfo' ).addClass( 'active' );
        $( '#versionMenu > .dropdown-toggle' ).html( _.template( versionTitleTmpl, version ) );
        $( '#versionInfo' ).html( _.template( infoTmpl, {
            title: version.title,
            yearString: util.upperCaseNumbers( String( version.year ) ),
            genre: version.genre,
            quantity: version.quantity,
            historyString: p.createHistoryString( version ),
            description: version.description,
            link: version.link
        }));

        $( '#versionInfo .label' ).bind( 'click', function( event ) {
            var name = $( event.currentTarget ).text();
            var location = _.find( data.locations(), function( location ) {
                return _.isEqual( location.name, name );
            });
            $( '#mapContainer' ).trigger( 'location:selected', location );
        });

        $( '#close-version-info' ).bind( 'click', function( event ) {
            event.stopPropagation();
            event.preventDefault();
            $( '#versionInfo' ).removeClass( 'active' );
        })

        $( '#version-description' ).slimScroll({
            height: '250px'
        });
    };

    p.hideVersionInfo = function( version ) {
        $( '#versionInfo' ).removeClass( 'active' );
    };

    p.createHistoryString = function( version ) {
        
        var assemble = function( personOrLocationArray, cssClass ) {
            cssClass = cssClass || '';
            var result = '';
            _.map( personOrLocationArray, function( personOrLocation ) {
                result += '<span class="' + cssClass + '">' + personOrLocation.name + '</span> & ';
            });
            return result.substr( 0, result.length - 3 );
        };

        var getRewrittenString = function( version ) {
            if ( _.isUndefined( version.rewritten ) ) { return ''; }
            return _.template( rewrittenTmpl, version.rewritten );
        };

        var historyString = _.template( authorShipTmpl, {
            writtenName: version.written.name,
            authorsString: assemble( version.authors, 'person' ),
            translatorsString: version.translators.length > 0 ? _.template( translatorsTmpl, { translatorsString: assemble( version.translators, 'person' ) } ) : '',
            editorsString: version.editors.length > 0 ? _.template( editorsTmpl, { editorsString: assemble( version.editors, 'person' ) } ) : '',
            rewrittenString: getRewrittenString( version )
        });

        historyString += _.template( publishedTmpl, {
            publisher: version.publisher,
            pubLocationNames: assemble( version.published, 'label label-inverse' )
        });

        return historyString;
    };

    p.showMapLegend = function( name ) {
        $( '#legend' ).html( _.template( legendTmpl, {
            year: util.upperCaseNumbers( name )
        }) );
    };

    return p;

}( ui || {} ) );