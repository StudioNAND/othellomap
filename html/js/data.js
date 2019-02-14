var data = ( function( p ) {
    var _locations = [],
        _connections = [];

    var addLocation = function( location ) {
        var loc = _.find( _locations, function( l ) {
                return l.name == location.name
                    && l.lat == location.lat
                    && l.lon == location.lon;
            });
        
        if ( _.isUndefined( loc ) ) {
            location.id = _.uniqueId();
            _locations.push( location );
            return location;
        }
        else {
            return loc;
        }
    };

    p.locations = function( version ) {
        if ( _.isUndefined( version ) ) {
            return _locations;
        }
        else {
            return _.filter( _locations, function( loc ) {
                return _.isEqual( version.written, loc )
                    || _.isEqual( version.rewritten, loc )
                    || _.contains( version.published, loc );
            });
        }
    };

    p.connect = function( version ) {
        var link;
        if ( _.isUndefined( version.rewritten ) ) {
            _.each( version.published, function( pub ) {
                link = {
                    id: _.uniqueId(),
                    source: version.written,
                    target: pub,
                    type: 'written-published',
                    version: version
                };
                _connections.push( link );
            });
        }
        else {
            link = {
                id: _.uniqueId(),
                source: version.written,
                target: version.rewritten,
                type: 'written-rewritten',
                version: version
            };
            _connections.push( link );

            _.each( version.published, function( pub ) {
                link = {
                    id: _.uniqueId(),
                    source: version.rewritten,
                    target: pub,
                    type: 'rewritten-published',
                    version: version
                };
                _connections.push( link );
            });
        }
    };

    p.connections = function( location ) {
        if ( _.isUndefined( location ) ) {
            return _connections;
        }
        else {
            return _.filter( _connections, function( conn ) {
                return _.isEqual( conn.source, location )
                    || _.isEqual( conn.target, location );
            });
        }
    }

    p.century = function( year ) {
        return Math.floor( year / 100 ) + '00';
    };

    p.versionName = function( row ) {
        var authors = _.reduce( row['Authors'].split( ',' ), function( result, authorString ) {
            return result + ', ' + authorString;
        });

        return authors + ' (' + util.upperCaseNumbers( row['Year'] ) + ')';
    };

    p.authors = function( row ) {
        var authors = [],
            authorStrings = _.reject( row['Authors'].split( ',' ), function( s ) { return s.length == 0 } ),
            genderStrings = _.reject( row['Genders'].split( ',' ), function( s ) { return s.length == 0 } );

        _.each( authorStrings, function( authorString, i ) {
            authors.push( {
                name: $.trim( authorString ),
                gender: $.trim( genderStrings[i] )
            });
        });
        return authors;
    };

    p.editors = function( row, wat ) {
        var editors = [],
            authorStrings = _.reject( row['Authors'].split( ',' ), function( s ) { return s.length == 0 } ),
            editorStrings = _.reject( row['Editors'].split( ',' ), function( s ) { return s.length == 0 } ),
            genderStrings = _.reject( row['Genders'].split( ',' ), function( s ) { return s.length == 0 } );

        var indexOffset = authorStrings.length - 1;
        _.each( editorStrings, function( editorString, i ) {
            editors.push( {
                name: $.trim( editorString ),
                gender: $.trim( genderStrings[indexOffset + i] )
            });
        });

        return editors;
    };

    p.translators = function( row ) {
        var translators = [],
            authorStrings = _.reject( row['Authors'].split( ',' ), function( s ) { return s.length == 0 } ),
            editorStrings = _.reject( row['Editors'].split( ',' ), function( s ) { return s.length == 0 } ),
            translatorStrings = _.reject( row['Translators'].split( ',' ), function( s ) { return s.length == 0 } ),
            genderStrings = _.reject( row['Genders'].split( ',' ), function( s ) { return s.length == 0 } );

        var indexOffset = authorStrings.length + editorStrings.length - 2;
        _.each( translatorStrings, function( translatorString, i ) {
            translators.push( {
                name: $.trim( translatorString ),
                gender: $.trim( genderStrings[indexOffset + i] )
            });
        });
        return translators;
    };

    p.written = function( row ) {
        return addLocation( {
            name: row['Written'],
            lat: parseFloat( row['7_lat_written'] ),
            lon: parseFloat( row['7_lon_written'] ),
            zoomlevels: [
                undefined, // 0
                undefined, // 1
                undefined, // 2
                undefined, // 3
                undefined, // 4
                undefined, // 5
                {
                    lat: parseFloat( row['6_lat_written'] ),
                    lon: parseFloat( row['6_lon_written'] ),
                },
                {
                    lat: parseFloat( row['7_lat_written'] ),
                    lon: parseFloat( row['7_lon_written'] ),
                },
                {
                    lat: parseFloat( row['8_lat_written'] ),
                    lon: parseFloat( row['8_lon_written'] ),
                }
                // ...
            ],
            accurate: {
                lat: parseFloat( row['lat_written'] ),
                lon: parseFloat( row['lon_written'] )
            }
        });
    };

    p.rewritten = function( row ) {
        if ( !_.isEmpty( row['Rewritten'] ) ) {
            return addLocation( {
                name: row['Rewritten'],
                lat: parseFloat( row['7_lat_rewritten'] ),
                lon: parseFloat( row['7_lon_rewritten'] ),
                zoomlevels: [
                    undefined, // 0
                    undefined, // 1
                    undefined, // 2
                    undefined, // 3
                    undefined, // 4
                    undefined, // 5
                    {
                        lat: parseFloat( row['6_lat_rewritten'] ),
                        lon: parseFloat( row['6_lon_rewritten'] ),
                    },
                    {
                        lat: parseFloat( row['7_lat_rewritten'] ),
                        lon: parseFloat( row['7_lon_rewritten'] ),
                    },
                    {
                        lat: parseFloat( row['8_lat_rewritten'] ),
                        lon: parseFloat( row['8_lon_rewritten'] ),
                    }
                    // ...
                ],
                accurate: {
                    lat: parseFloat( row['lat_rewritten'] ),
                    lon: parseFloat( row['lon_rewritten'] )
                }
            });
        }
    };

    p.published = function( row ) {
        var published = []
        if ( !_.isEmpty( row['Published 1'] ) ) {
            published.push( addLocation( {
                name: row['Published 1'],
                lat: parseFloat( row['7_lat_pub1'] ),
                lon: parseFloat( row['7_lon_pub1'] ),
                zoomlevels: [
                    undefined, // 0
                    undefined, // 1
                    undefined, // 2
                    undefined, // 3
                    undefined, // 4
                    undefined, // 5
                    {
                        lat: parseFloat( row['6_lat_pub1'] ),
                        lon: parseFloat( row['6_lon_pub1'] ),
                    },
                    {
                        lat: parseFloat( row['7_lat_pub1'] ),
                        lon: parseFloat( row['7_lon_pub1'] ),
                    },
                    {
                        lat: parseFloat( row['8_lat_pub1'] ),
                        lon: parseFloat( row['8_lon_pub1'] ),
                    }
                    // ...
                ],
                accurate: {
                    lat: parseFloat( row['lat_pub1'] ),
                    lon: parseFloat( row['lon_pub1'] )
                }
            }));
        }
        if ( !_.isEmpty( row['Published 2'] ) ) {
            published.push( addLocation( {
                name: row['Published 2'],
                lat: parseFloat( row['7_lat_pub2'] ),
                lon: parseFloat( row['7_lon_pub2'] ),
                zoomlevels: [
                    undefined, // 0
                    undefined, // 1
                    undefined, // 2
                    undefined, // 3
                    undefined, // 4
                    undefined, // 5
                    {
                        lat: parseFloat( row['6_lat_pub2'] ),
                        lon: parseFloat( row['6_lon_pub2'] ),
                    },
                    {
                        lat: parseFloat( row['7_lat_pub2'] ),
                        lon: parseFloat( row['7_lon_pub2'] ),
                    },
                    {
                        lat: parseFloat( row['8_lat_pub2'] ),
                        lon: parseFloat( row['8_lon_pub2'] ),
                    }
                    // ...
                ],
                accurate: {
                    lat: parseFloat( row['lat_pub2'] ),
                    lon: parseFloat( row['lon_pub2'] )
                }
            }));
        }
        return published;
    };

    return p;
}( data || {} ) );