$( document ).ready( function() {
    var BASE_URL = 'map/';
    var defaultLayer = new MM.TemplatedLayer( BASE_URL + 'vvv/{Z}/{X}/{Y}.png' );
    defaultLayer.name = 'default';

    var mapLayers = {
        '1820': new MM.TemplatedLayer( BASE_URL + '1820/{Z}/{X}/{Y}.png' ),
        '1826': new MM.TemplatedLayer( BASE_URL + '1826/{Z}/{X}/{Y}.png' ),
        '1830': new MM.TemplatedLayer( BASE_URL + '1830/{Z}/{X}/{Y}.png' ),
        '1834': new MM.TemplatedLayer( BASE_URL + '1834/{Z}/{X}/{Y}.png' ),
        '1848': new MM.TemplatedLayer( BASE_URL + '1848/{Z}/{X}/{Y}.png' ),
        '1850': new MM.TemplatedLayer( BASE_URL + '1850/{Z}/{X}/{Y}.png' ),
        '1853': new MM.TemplatedLayer( BASE_URL + '1853/{Z}/{X}/{Y}.png' ),
        '1863': new MM.TemplatedLayer( BASE_URL + '1863/{Z}/{X}/{Y}.png' ),
        '1867': new MM.TemplatedLayer( BASE_URL + '1867/{Z}/{X}/{Y}.png' ),
        '1871': new MM.TemplatedLayer( BASE_URL + '1871/{Z}/{X}/{Y}.png' ),
        '1890': new MM.TemplatedLayer( BASE_URL + '1890/{Z}/{X}/{Y}.png' ),
        '1914': new MM.TemplatedLayer( BASE_URL + '1914/{Z}/{X}/{Y}.png' ),
    };

    var dataTotal = 5692,
        versions = [], // list of all versions (for ui menus etc.)
        versionsLayer,
        timeline,
        zoomlevel = 7,
        year = d3.scale.linear()
            .domain( [0, 100] );

    var map = mapbox.map( 'map', defaultLayer, null, [
                MM.DragHandler(),
                MM.DoubleClickHandler(),
                MM.MouseWheelHandler(),
                MM.TouchHandler()
                /*easey_handlers.DoubleClickHandler(),
                easey_handlers.DragHandler(),
                easey_handlers.TouchHandler()*/] );

    _.each( mapLayers, function( layer, year ) {
        layer.name = year;
        layer.disable();
        map.addLayer( layer );
    });
    map.getLayer( 'default' ).enable();

    map.ui.zoomer.add();

    map.setZoomRange( 6, 8 );
    map.setPanLimits( new MM.Extent( 65, -30, 30, 45 ) );
    map.centerzoom({lat: 50.538728381, lon: 10.3291015625}, zoomlevel );

    $( '.map-credits' ).hide();
    $( '#about' ).modal( 'show' );
    
    d3.csv( './data/versions.csv' )
        .on( 'progress', function( request ) {
            var progress = d3.event.loaded / dataTotal;
            //$( '#loadProgress > .status' ).text( formatPercent( progress ) );
        })
        .on( 'load', function( csv ) {
            _.each( csv, function( row, i ) {

                var version = {
                    id: _.uniqueId(),
                    name: data.versionName( row ),
                    title: row['Name'],
                    year: parseInt( row['Year'] ),
                    description: row['Description'],
                    link: row['Link'],
                    publisher: row['Publisher'],
                    authors: data.authors( row ),
                    editors: data.editors( row ),
                    translators: data.translators( row ),
                    genre: row['Genre 1 (book or script)'],
                    quantity: row['Genre 2 (quanitity of plays translated)'],
                    other: row['Genre 3: other details'],
                    language: row['Language'],
                    written: data.written( row ), // location
                    rewritten: data.rewritten( row ), // location
                    published: data.published( row ) // locations
                }

                data.connect( version );
                versions.push( version );
            });

            versions = _.sortBy( versions, function( v ) { return v.year; } );
            ui.createVersionList( versions );

            versionsLayer = d3layer().data( data );
            map.addLayer( versionsLayer );

            map.addCallback( 'zoomed', function( map, zoomOffset ) {
                if ( !_.isUndefined( zoomOffset ) ) {
                    zoomlevel = Math.min( Math.max( zoomlevel + zoomOffset, 6 ), 8 );
                    _.each( data.locations(), function( location ) {
                        var loc = location.zoomlevels[zoomlevel];
                        location.lat = loc.lat;
                        location.lon = loc.lon;
                        if ( loc.lat != location.accurate.lat || loc.lon != location.accurate.lon ) {
                            d3.select( 'g.location[data-location=id_' + location.id + ']' ).select( '.arrow' ).classed( 'hidden', false );
                        }
                        else {
                            d3.select( 'g.location[data-location=id_' + location.id + ']' ).select( '.arrow' ).classed( 'hidden', true );   
                        }
                    });
                    map.draw();
                }
            });

            $( '#mapContainer' ).bind( 'version:selected', versionSelected );
            $( '#mapContainer' ).bind( 'version:unselected', versionUnselected );
            $( '#mapContainer' ).bind( 'location:selected', locationSelected );
            $( '#mapContainer' ).bind( 'version:hovered', versionHovered );
            $( '#mapContainer' ).bind( 'version:unhovered', versionUnhovered );

            $( '.dropdown-submenu > .dropdown-menu > li' ).bind( 'click', function( event ) {
                var vId = parseInt( $( event.target ).attr( 'data-versionid' ) );
                var version  = _.find( versions, function( version ) { return vId == version.id; } );
                $( '#mapContainer' ).trigger( 'location:selected', version.written );
                $( '#mapContainer' ).trigger( 'version:selected', version );
            });

            var minYear = _.min( versions, function( version ) { return version.year; });
            var maxYear = _.max( versions, function( version ) { return version.year; });
            // set range for interpolation
            year.rangeRound( [minYear.year, maxYear.year] );

            var $slider = $( "#yearSlider" );
            $slider.slider({
                range: true,
                values: [ 0, 100 ],
                slide: yearRangeSelected
            });

            $( '#lowerEnd' ).text( util.upperCaseNumbers( String( minYear.year ) ) );
            $( '#upperEnd' ).text( util.upperCaseNumbers( String( maxYear.year ) ) );
        })
        .on( 'error', function( error ) {
            console.error( 'error', error );
        })
        .get();

    $( window ).resize( function() {
        if ( !_.isNull( versionsLayer ) ) { versionsLayer.resize(); }
    });

    var versionSelected = function( event, version ) {
        // deselect all
        versionUnselected();
        // change dropdown title & display info
        ui.showVersionInfo( version );
        getMapForYear( version.year );
        
        // show version connections
        d3.selectAll( '.connection[data-version=id_' + version.id + ']' ).classed( 'selected', true );
        d3.selectAll( '.version[data-version=id_' + version.id + ']' ).classed( 'selected', true );
        d3.selectAll( '.year-label[data-version=id_' + version.id + ']' ).classed( 'selected', true );
        _.each( data.locations( version ), function( location ) {
            var txt,
                s = 6.0;

            var _e = d3.select( '.location[data-location=id_' + location.id + '] .event' );
                _e.classed( 'active', true );

                _e.select( '.event-label' )
                    .text( function( location ) {
                        var s = [];
                        if ( _.isEqual( version.written, location ) ) { s.push( 'written' ); }
                        if ( _.isEqual( version.rewritten, location ) ) { s.push( 'rewritten' ); }
                        if ( _.contains( version.published, location ) ) { s.push( 'published' ); }
                        txt = _.reduce( s, function( result, el ) { return result + el + ' & ' }, '' );
                        txt = txt.substr( 0, txt.length - 2 );
                        return txt;
                    })
                _e.select( '.event-label-background' )
                    .attr( 'x', function( location ) {
                        return -s * 0.5 * txt.length;
                    })
                    .attr( 'width', function( location ) {
                        return s * txt.length;
                    });
        });
    };

    var versionUnselected = function( event, version ) {
        ui.hideVersionInfo();

        d3.selectAll( '.location .event' ).classed( 'active', false );

        d3.selectAll( '.connection' ).classed( 'selected', false );
        d3.selectAll( '.version' ).classed( 'selected', false );
        d3.selectAll( '.year-label' ).classed( 'selected', false );
    };

    var versionHovered = function( event, version ) {
        // unhover all
        versionUnhovered();
        d3.selectAll( '.connection[data-version=id_' + version.id + ']' ).classed( 'hovered', true );
        d3.selectAll( '.version[data-version=id_' + version.id + ']' ).classed( 'hovered', true );
        d3.selectAll( '.year-label[data-version=id_' + version.id + ']' ).classed( 'hovered', true );
    };

    var versionUnhovered = function( event, version ) {
        d3.selectAll( '.connection' ).classed( 'hovered', false );
        d3.selectAll( '.version' ).classed( 'hovered', false );
        d3.selectAll( '.year-label' ).classed( 'hovered', false );
    };

    var locationSelected = function( event, location ) {
        if ( !_.isNaN( location.accurate.lat )
          && !_.isNaN( location.accurate.lon ) ) {
            map.center( location.accurate, true );
        }
    };

    var yearRangeSelected = function( event, ui ) {
        var s = year( ui.values[0] ),
            e = year( ui.values[1] );

        $( '#lowerEnd' ).text( util.upperCaseNumbers( String( s ) ) );
        $( '#upperEnd' ).text( util.upperCaseNumbers( String( e ) ) );

        // filter depending on year range
        var filtered = _.filter( versions, function( version ) {
            return version.year >= s && version.year <= e;
        });

        // remove filtered class from all versions in range
        // (regardles if they have it or not)
        _.each( filtered, function( version ) {
            d3.selectAll( '.version[data-version=id_' + version.id + ']' ).classed( 'filtered', false );
            d3.selectAll( '.year-label[data-version=id_' + version.id + ']' ).classed( 'filtered', false );
            d3.selectAll( '.connection[data-version=id_' + version.id + ']' ).classed( 'filtered', false );
        });
        // add filtered class to all versions not within range 
        _.each( _.difference( versions, filtered ), function( version ) {
            d3.selectAll( '.version[data-version=id_' + version.id + ']' ).classed( 'filtered', true );
            d3.selectAll( '.year-label[data-version=id_' + version.id + ']' ).classed( 'filtered', true );
            d3.selectAll( '.connection[data-version=id_' + version.id + ']' ).classed( 'filtered', true );
        });

        d3.selectAll( 'g.location' )
            .each( function( location ) {
                var _t = d3.select( this );
                var num = _t.selectAll( '.year-label' )
                    .filter( function( label ) {
                        var year = parseInt( d3.select( this ).attr( 'data-year' ) );
                        return year >= s && year <= e;
                    })[0].length;
                if ( num == 0 ) {
                    _t.select( 'text.location' ).classed( 'filtered', true );
                    _t.select( 'polygon.arrow' ).classed( 'filtered', true );
                }
                else {
                    _t.select( 'text.location' ).classed( 'filtered', false );
                    _t.select( 'polygon.arrow' ).classed( 'filtered', false );
                }
            });
    };

    var getMapForYear = function( versionYear ) {
        _.map( mapLayers, function( layer ) { layer.disable(); });
        map.getLayer( 'default' ).disable();

        var years = _.keys( mapLayers ),
            newLayerSet = false;
        _.each( _.without( years, _.last( years ) ), function( year, i ) {
            if ( versionYear >= parseInt( year ) && versionYear < parseInt( years[i+1] ) ) {
                map.getLayer( year ).enable();
                newLayerSet = true;
                ui.showMapLegend( String( year ) );
            }
        });
        if ( !newLayerSet ) {
            map.getLayer( 'default' ).enable();
            ui.showMapLegend( "Modern" );
            $( '.map-credits' ).hide();
        }
        else {
            $( '.map-credits' ).show();
        }
    };
});