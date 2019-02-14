var util = ( function( p ) {
    
    // calluna sans unicode characters for uppercase 0-9
    var uppercaseNumbers = ['', '', '', '', '', '', '', '', '', ''];

    String.prototype.replaceAt = function( index, c ) {
        return this.substr( 0, index ) + c + this.substr( index + ( c.length == 0 ? 1 : c.length ) );
    }

    p.upperCaseNumbers = function( digitString ) {
        return digitString;
        // Disabled due to switch from Calluna Sans to Open Sans
        // if (/^[\d\.]{3,}$/.test( digitString ) ) {
        //     var replaced = '';
        //     _.map( digitString, function( character, i ) {
        //         replaced += uppercaseNumbers[parseInt( character )]
        //     });
        //     return replaced;
        // } else {
        //     return digitString;
        // }
    };

    return p;
}( util || {} ) );