"""ezekit CLI — main entry point."""

import click

from ezekit import __version__
from ezekit.core.module_loader import get_installed_modules


@click.group(invoke_without_command=True)
@click.version_option(__version__, prog_name="ezekit")
@click.pass_context
def cli(ctx: click.Context) -> None:
    """ezekit — A modular toolkit for dataset preparation."""
    if ctx.invoked_subcommand is None:
        click.echo(ctx.get_help())


@cli.command("list-modules")
def list_modules() -> None:
    """List all installed ezekit modules."""
    modules = get_installed_modules()
    if not modules:
        click.echo("No modules installed.")
        return
    click.echo("Installed modules:")
    for name, info in modules.items():
        click.echo(f"  {name} — {info['description']}")


def _register_module_commands() -> None:
    """Discover and register CLI commands from installed modules."""
    modules = get_installed_modules()
    for name, info in modules.items():
        if "cli_group" in info:
            cli.add_command(info["cli_group"], name)


_register_module_commands()
