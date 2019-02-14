function d3layer() {

    var f = {},
        versionData,
        centeredLocation,
        r = d3.scale.linear(),
        a = d3.scale.linear();
    
    var div = d3.select( '#d3layer' )
        svg = div.append( 'svg' );
        /*svg.append( 'rect' )
           .attr( 'class', 'unmappedBg' )
           .attr( 'x', 20.0 )
           .attr( 'y', Math.round( window.innerHeight - 90 ) )
           .attr( 'width', 322 )
           .attr( 'height', 70 );*/

    f.parent = div.node();

    f.project = function( locationItem ) {
        // if a location is unknown, place the item in the top left
        if ( _.isNaN( locationItem.lat ) || _.isNaN( locationItem.lon ) ) {
            if ( _.isEqual( locationItem.name, 'not known' ) ) {
                return {
                    x: 70,
                    y: window.innerHeight - 80
                };
            }
            else if ( _.isEqual( locationItem.name, 'not published' ) ) {
                return {
                    x: 180,
                    y: window.innerHeight - 80
                };
            }
            else if ( _.isEqual( locationItem.name, 'online' ) ) {
                return {
                    x: 290,
                    y: window.innerHeight - 80
                };
            }
        }

        return f.map.locationPoint( locationItem );
    };

    // will be run only once, no matter how often it is invoked
    // http://underscorejs.org/#once
    f.init = _.once( function() {
        f.resize();
    });

    f.resize = function() {
        svg.attr( 'width', f.map.dimensions.x )
           .attr( 'height', f.map.dimensions.y )
           .style( 'margin-left', '0px' )
           .style( 'margin-top', '0px' );
    };

    f.draw = function() {
        f.init();
        
        d3.selectAll( 'polygon.arrow' )
            .attr( 'transform', function( location ) {
                var p1 = f.project( location ),
                    p2 = f.project( location.accurate );
                
                var dist = {x: p2.x - p1.x, y: p2.y - p1.y}
                    angle = Math.atan2( p2.y - p1.y, p2.x - p1.x ) * 180.0 / Math.PI;
                return 'translate(' + dist.x + ',' + dist.y + ') rotate(' + angle + ')';
            });

        svg.selectAll( 'g.location' )
            .attr( 'transform', function( d ) {
                var p = f.project( d );
                var z = 1.0;
                if ( _.isEqual( f.map.zoom(), 6 ) ) {
                    z = 0.75;
                }
                else if ( _.isEqual( f.map.zoom(), 8 ) ) {
                    z = 1.2;
                }
                return 'translate(' + Math.round( p.x ) + ',' + Math.round( p.y ) + ') scale(' + z + ')';
            });
        svg.selectAll( 'line.connection' )
            .each( function( d ) {
                var _t = d3.select( this );
                var s = f.project( d.source );
                var t = f.project( d.target );
                _t.attr( 'x1', s.x );
                _t.attr( 'y1', s.y );
                _t.attr( 'x2', t.x );
                _t.attr( 'y2', t.y );
            });
    };

    f.data = function( data ) {
        versionData = data;

        // create connecting lines
        svg.selectAll( 'line' )
            .data( versionData.connections() )
            .enter().append( 'line' )
            .attr( 'class', 'connection' )
            .attr( 'data-version', function( connection ) {
                return 'id_' + connection.version.id;
            })
            .attr( 'data-connection', function( connection ) {
                return 'id_' + connection.id;
            });
        // create micro timelines for locations
        svg.selectAll( 'g' )
            .data( versionData.locations() )
            .enter().append( 'g' )
            .attr( 'class', 'location' )
            .attr( 'data-location', function( location ) {
                return 'id_' + location.id;
            })
            .each( function( location ) {
                var _t = d3.select( this );

                var s = 6.0;
                _t.append( 'rect' )
                    .attr( 'x', function( location ) { return -s * 0.5 * location.name.length; } )
                    .attr( 'y', 17 )
                    .attr( 'width', function( location ) { return s * location.name.length; } )
                    .attr( 'height', 17 )
                    .attr( 'class', 'location-label-background' );

                _t.append( 'text' )
                    .text( function( location ) { return location.name; })
                    .attr( 'class', 'location-label' )
                    .attr( 'x', 0 )
                    .attr( 'y', 28 )
                    .attr( 'text-anchor', 'middle' );

                var needsArrow = false;
                _.map( location.zoomlevels, function( loc ) {
                    if ( !_.isUndefined( loc ) ) {
                        if ( loc.lat != location.accurate.lat ||
                             loc.lon != location.accurate.lon ) {
                            if ( !_.isNaN( loc.lat ) && !_.isNaN( loc.lon ) ) {
                                needsArrow = true;
                            }
                        }
                    }
                });

                if ( needsArrow ) {
                    _t.append( 'polygon' )
                        .attr( 'class', function( location ) {
                            var hidden = 'hidden';
                            if ( location.lat != location.accurate.lat ||
                                 location.lon != location.accurate.lon ) {
                                if ( !_.isNaN( location.lat ) && !_.isNaN( location.lon ) ) {
                                    hidden = '';
                                }
                            }
                            return 'arrow ' + hidden;
                        })
                        .attr( 'points', function( location ) {
                            return '-12,4 0,0 -12,-4';
                        });
                }

                // get all links to this location, grouped by year
                // WARNING: this doesn’t handle the case for which 1 location has a year twice!
                var connectionGroups = _.groupBy( data.connections( location ),
                    function( connection ) {
                        var yearString = String( connection.version.year ),
                            centString = yearString.substr( 0, 2 ),
                            fract = parseInt( yearString.substr( 2, 3 ) );
                        if ( fract < 50 ) { centString += '00'; } else { centString += '50'; }
                        return centString;
                    });

                var centuries = _.keys( connectionGroups ),
                    centuries = _.sortBy( centuries, function( century ) { return parseInt( century );} );
                    numCenturies = centuries.length;
                var labelWidth =  30,
                    labelHeight = 14,
                    labelMargin = 0;

                var y = 0;
                var x = -0.5 * ( numCenturies * ( labelWidth + labelMargin ) );

                _.each( centuries, function( century ) {
                    var group = connectionGroups[century];

                    group = _.sortBy( group, function( connection )  {
                        return connection.version.year;
                    }).reverse();

                    group = _.uniq( group, true, function( item ) {
                        return item.version.id;
                    });

                    _.each( group, function( connection, i ) {

                        var bg = _t.append( 'rect' )
                            .data( [connection] )
                            .attr( 'width', labelWidth )
                            .attr( 'height', labelHeight )
                            .attr( 'x', x )
                            .attr( 'y', function( connection ) {
                                return i * ( -labelHeight );
                            })
                            .attr( 'class', function( connection ) {
                                return 'version ' + connection.version.genre.toLowerCase();
                            })
                            .attr( 'data-version', function( connection ) {
                                return 'id_' + connection.version.id;
                            })
                            .on( 'mouseover', versionHovered )
                            .on( 'mouseout', versionUnhovered )
                            .on( 'click', versionSelected );

                        _t.append( 'text' )
                            .data( [connection] )
                            .attr( 'x', x + labelWidth * 0.5 )
                            .attr( 'y', function( connection ) {
                                return i * ( -labelHeight ) + labelHeight - 3;
                            })
                            .attr( 'text-anchor', 'middle' )
                            .text( function ( location ) {
                                return util.upperCaseNumbers( String( connection.version.year ) );
                            })
                            .attr( 'class', function( connection ) {
                                return 'year-label ' + connection.version.genre.toLowerCase();
                            })
                            .attr( 'data-version', function( connection ) {
                                return 'id_' + connection.version.id;
                            })
                            .attr( 'data-year', function( location ) {
                                return String( connection.version.year );
                            })
                            .attr( 'title', function( location ) {
                                return 'hello';
                            })
                            .on( 'mouseover', versionHovered )
                            .on( 'mouseout', versionUnhovered )
                            .on( 'click', versionSelected );

                            function versionHovered( connection ) {
                                d3.event.stopPropagation();
                                $( f.parent ).trigger( 'version:hovered', connection.version );
                            };

                            function versionUnhovered( connection ) {
                                d3.event.stopPropagation();
                                $( f.parent ).trigger( 'version:unhovered', connection.version );
                            };

                            function versionSelected( connection ) {
                                d3.event.stopPropagation();
                                $( f.parent ).trigger( 'version:selected', connection.version );
                                $( f.parent ).trigger( 'location:selected', location );
                            };
                    });

                    _t.append( 'rect' )
                        .attr( 'x', x + 1 )
                        .attr( 'y', function( connection ) {
                            return group.length * ( -labelHeight );
                        })
                        .attr( 'width', labelWidth - 2 )
                        .attr( 'height', labelHeight - 2 )
                        .attr( 'class', 'year-group-label-bg' );

                    _t.append( 'text' )
                        .text( function ( location ) {
                            return util.upperCaseNumbers( century ) + 's';
                        })
                        .attr( 'class', 'year-group-label' )
                        .attr( 'data-yearGroup', function ( location ) {
                            return century + 's';
                        })
                        .attr( 'x', x + labelWidth * 0.5 )
                        .attr( 'y', function( connection ) {
                            return group.length * ( -labelHeight ) + labelHeight - 5;
                        })
                        .attr( 'text-anchor', 'middle' );
                    
                    x += labelWidth + labelMargin;
                });
            });

        return f;
    };

    return f;
}