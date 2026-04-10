{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs = { nixpkgs, ... }:
  let
    system = "x86_64-linux";
    pkgs   = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
      packages = with pkgs; [
        nodejs_20
        prettier
        typescript-language-server
        typescript
      ];

      shellHook = ''
        echo "CSE160 devenv ready"
        echo "Prettier: $(prettier --version)"
      '';
    };
  };
}
