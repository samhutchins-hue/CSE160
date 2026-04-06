# flake.nix
{
  inputs = {
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-unstable";
    devenv.url      = "github:cachix/devenv";
    devenv.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { nixpkgs, devenv, ... }@inputs:
  let
    system = "x86_64-linux";
    pkgs   = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = devenv.lib.mkShell {
      inherit inputs pkgs;
      modules = [{
        packages = with pkgs; [
          nodejs_20
          nodePackages.prettier
          # python3 available as fallback server if you ever want it
        ];

        # Optional: `devenv up` starts a local server
        processes.serve.exec = "python3 -m http.server 8080";

        enterShell = ''
          echo "CSE160 devenv ready"
          echo "Prettier: $(prettier --version)"
        '';
      }];
    };
  };
}
