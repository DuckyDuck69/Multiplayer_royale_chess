function formatPieceName(pieceName) {
  switch (pieceName) {
    case "pawn":
      return "Pawn";
    case "knight":
      return "Knight";
    case "bishop":
      return "Bishop";
    case "rook":
      return "Rook";
    case "queen":
      return "Queen";
    case "king":
      return "King";
    case "light_pawn":
      return "Light Pawn";
    case "light_knight":
      return "Light Knight";
    case "light_bishop":
      return "Light Bishop";
    case "light_rook":
      return "Light Rook";
    case "light_queen":
      return "Light Queen";
    case "light_king":
      return "Light King";
    case "dark_pawn":
      return "Dark Pawn";
    case "dark_knight":
      return "Dark Knight";
    case "dark_bishop":
      return "Dark Bishop";
    case "dark_rook":
      return "Dark Rook";
    case "dark_queen":
      return "Dark Queen";
    case "dark_king":
      return "Dark King";
    case "light_builder":
      return "Light Builder";
    case "dark_builder":
      return "Dark Builder";
    case "light_goat_chimera":
      return "Light Goat Chimera";
    case "dark_goat_chimera":
      return "Dark Goat Chimera";
    case "light_lion_chimera":
      return "Light Lion Chimera";
    case "dark_lion_chimera":
      return "Dark Lion Chimera";
    case "light_juggernaut":
      return "Light Juggernaut";
    case "dark_juggernaut":
      return "Dark Juggernaut";
    case "light_medusa":
      return "Light Medusa";
    case "dark_medusa":
      return "Dark Medusa";
    case "light_pegasus":
      return "Light Pegasus";
    case "dark_pegasus":
      return "Dark Pegasus";
    default:
      return pieceName; // Return original string if not found
  }
}