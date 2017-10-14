from sqlalchemy import (
    Table, Column, Integer, BigInteger, String, MetaData)
from auslib.db import CompatibleBooleanColumn


metadata = MetaData()


emergency_shutoff = Table(
    'emergency_shutoff', metadata,
    Column('shutoff_id', Integer, primary_key=True, autoincrement=True),
    Column('product', String(15), nullable=False),
    Column('channel', String(75), nullable=False),
    Column('updates_disabled', CompatibleBooleanColumn, default=False, nullable=False))


emergency_shutoff_history = Table(
    'emergency_shutoff_history', metadata,
    Column('change_id', Integer, primary_key=True, autoincrement=True),
    Column('changed_by', String(100), nullable=False),
    Column('shutoff_id', Integer, nullable=False),
    Column('product', String(15), nullable=False),
    Column('channel', String(75), nullable=False),
    Column('updates_disabled', CompatibleBooleanColumn, nullable=False))


emergency_shutoff_scheduled_changes = Table(
    'emergency_shutoff_scheduled_changes', metadata,
        Column("sc_id", Integer, primary_key=True, autoincrement=True),
        Column("scheduled_by", String(100), nullable=False),
        Column("complete", CompatibleBooleanColumn, default=False),
        Column("change_type", String(50), nullable=False),
        Column('base_shutoff_id', Integer, primary_key=True, autoincrement=True),
        Column('base_product', String(15), nullable=False),
        Column('base_channel', String(75), nullable=False),
        Column('base_updates_disabled', CompatibleBooleanColumn, default=False, nullable=False))


emergency_shutoff_scheduled_changes_history = Table(
    'emergency_shutoff_scheduled_changes_history', metadata,
    Column("change_id", Integer, primary_key=True, autoincrement=True),
    Column("changed_by", String(100), nullable=False),
    Column("sc_id", Integer, primary_key=True, autoincrement=True),
    Column("scheduled_by", String(100), nullable=False),
    Column("complete", CompatibleBooleanColumn, default=False),
    Column("change_type", String(50), nullable=False),
    Column('base_shutoff_id', Integer, primary_key=True, autoincrement=True),
    Column('base_product', String(15), nullable=False),
    Column('base_channel', String(75), nullable=False),
    Column('base_updates_disabled', CompatibleBooleanColumn, default=False, nullable=False))


emergency_shutoff_scheduled_changes_signoffs = Table(
    'emergency_shutoff_scheduled_changes_signoffs', metadata,
    Column("sc_id", Integer, primary_key=True, autoincrement=False),
    Column("username", String(100), primary_key=True),
    Column("role", String(50), nullable=False))


emergency_shutoff_scheduled_changes_signoffs_history = Table(
    'emergency_shutoff_scheduled_changes_signoffs_history', metadata,
        Column("change_id", Integer, primary_key=True, autoincrement=True),
        Column("changed_by", String(100), nullable=False),
        Column("sc_id", Integer, nullable=False, autoincrement=False),
        Column("username", String(100), nullable=False),
        Column("role", String(50)))


def upgrade(migrate_engine):
    metadata.bind = migrate_engine
    bigintType = BigInteger

    if migrate_engine.name == 'sqlite':
        bigintType = Integer

    emergency_shutoff_history.append_column(
        Column('timestamp', bigintType, nullable=False))

    emergency_shutoff_scheduled_changes.append_column(
        Column('timestamp', bigintType, nullable=False))

    emergency_shutoff_scheduled_changes_history.append_column(
        Column('when', bigintType, nullable=False))
    emergency_shutoff_scheduled_changes_history.append_column(
        Column('timestamp', bigintType, nullable=False))

    emergency_shutoff_scheduled_changes_signoffs_history.append_column(
        Column('timestamp', bigintType, nullable=False))

    metadata.create_all()


def downgrade(migrate_engine):
    metadata.bind = migrate_engine
    Table('emergency_shutoff', metadata, autoload=True).drop()
    Table('emergency_shutoff_history', metadata, autoload=True).drop()
    Table('emergency_shutoff_scheduled_changes', metadata, autoload=True).drop()
    Table('emergency_shutoff_scheduled_changes_history', metadata, autoload=True).drop()
    Table('emergency_shutoff_scheduled_changes_signoffs', metadata, autoload=True).drop()
    Table('emergency_shutoff_scheduled_changes_signoffs_history', metadata, autoload=True).drop()
