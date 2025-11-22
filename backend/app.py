from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
import logging
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Union, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, '..', 'project.db')

def get_db_connection():
    """Create and return a database connection."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logger.error(f"Database connection error: {e}")
        raise

# ==================== ROUTES ====================

@app.route('/', methods=['GET'])
def root():
    """Root endpoint that provides API information."""
    return jsonify({
        'message': 'Metro Sync System API',
        'status': 'running',
        'endpoints': {
            'health': '/health',
            'passengers': '/passengers',
            'cards': '/cards',
            'stations': '/stations',
            'trips': '/trips',
            'transactions': '/transactions',
            'fare_rules': '/fare-rules'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    try:
        conn = get_db_connection()
        conn.execute('SELECT 1')
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@app.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total Passengers
        cursor.execute('SELECT COUNT(*) as count FROM Passenger')
        total_passengers = cursor.fetchone()['count']
        
        # Active Cards (Status = 'Active')
        cursor.execute("SELECT COUNT(*) as count FROM Card WHERE Status = 'Active'")
        active_cards = cursor.fetchone()['count']
        
        # Blocked Cards
        cursor.execute("SELECT COUNT(*) as count FROM Card WHERE Status = 'Blocked'")
        blocked_cards = cursor.fetchone()['count']
        
        # Total Balance across all cards
        cursor.execute('SELECT COALESCE(SUM(Balance), 0) as total FROM Card')
        total_balance = cursor.fetchone()['total']
        
        # Total Trips
        cursor.execute('SELECT COUNT(*) as count FROM Trip')
        total_trips = cursor.fetchone()['count']
        
        # Active Trips (trips without ExitTime are considered active)
        cursor.execute("SELECT COUNT(*) as count FROM Trip WHERE ExitTime IS NULL")
        active_trips = cursor.fetchone()['count']
        
        # Total Stations
        cursor.execute('SELECT COUNT(*) as count FROM Station')
        total_stations = cursor.fetchone()['count']
        
        # Average Fare
        cursor.execute('SELECT COALESCE(AVG(FareAmount), 0) as avg FROM FareRule')
        average_fare = cursor.fetchone()['avg']
        
        # Total Transactions
        cursor.execute('SELECT COUNT(*) as count FROM [Transaction]')
        total_transactions = cursor.fetchone()['count']
        
        # Total Revenue (sum of all transaction amounts)
        cursor.execute('SELECT COALESCE(SUM(Amount), 0) as total FROM [Transaction]')
        total_revenue = cursor.fetchone()['total']
        
        # Recent Transactions (last 5)
        cursor.execute('''
            SELECT t.TransactionID, t.Amount, t.TransactionDate, t.TransactionType,
                   c.CardNumber, p.FirstName, p.LastName
            FROM [Transaction] t
            JOIN Card c ON t.CardID = c.CardID
            JOIN Passenger p ON c.PassengerID = p.PassengerID
            ORDER BY t.TransactionDate DESC
            LIMIT 5
        ''')
        recent_transactions = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            'totalPassengers': total_passengers,
            'activeCards': active_cards,
            'blockedCards': blocked_cards,
            'totalBalance': float(total_balance),
            'totalTrips': total_trips,
            'activeTrips': active_trips,
            'totalStations': total_stations,
            'averageFare': float(average_fare),
            'totalTransactions': total_transactions,
            'totalRevenue': float(total_revenue),
            'recentTransactions': recent_transactions
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@app.route('/passengers', methods=['GET'])
def get_passengers():
    """Get all passengers."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM Passenger')
        passengers = [dict(row) for row in cursor.fetchall()]
        return jsonify(passengers), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/passengers', methods=['POST'])
def create_passenger():
    """Create a new passenger."""
    conn = None
    try:
        data = request.get_json()
        required_fields = ['FirstName', 'LastName', 'Email']
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO Passenger (FirstName, LastName, Email, PhoneNumber, RegistrationDate)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['FirstName'], data['LastName'], data['Email'], 
              data.get('PhoneNumber', ''), datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
        
        conn.commit()
        passenger_id = cursor.lastrowid
        logger.info(f"Created passenger with ID {passenger_id}")
        
        return jsonify({"message": "Passenger created successfully", "PassengerID": passenger_id}), 201
        
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "Email already exists"}), 409
        logger.error(f"Integrity error in create_passenger: {str(e)}")
        return jsonify({"error": "Database integrity error"}), 500
    except Exception as e:
        logger.error(f"Error in create_passenger: {str(e)}")
        return jsonify({"error": "Failed to create passenger"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/passengers/<int:passenger_id>', methods=['PUT'])
def update_passenger(passenger_id: int):
    """Update an existing passenger."""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM Passenger WHERE PassengerID = ?', (passenger_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Passenger not found"}), 404
        
        update_fields = []
        params = []
        
        if 'FirstName' in data:
            update_fields.append("FirstName = ?")
            params.append(data['FirstName'])
        if 'LastName' in data:
            update_fields.append("LastName = ?")
            params.append(data['LastName'])
        if 'Email' in data:
            update_fields.append("Email = ?")
            params.append(data['Email'])
        if 'PhoneNumber' in data:
            update_fields.append("PhoneNumber = ?")
            params.append(data['PhoneNumber'])
            
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400
            
        params.append(passenger_id)
        update_query = f"UPDATE Passenger SET {', '.join(update_fields)} WHERE PassengerID = ?"
        
        cursor.execute(update_query, params)
        conn.commit()
        
        return jsonify({"message": "Passenger updated successfully"}), 200
        
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "Email already exists"}), 409
        return jsonify({"error": "Database integrity error"}), 500
    except sqlite3.Error as e:
        logger.error(f"Database error in update_passenger: {str(e)}")
        return jsonify({"error": "Failed to update passenger"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/passengers/<int:passenger_id>', methods=['DELETE'])
def delete_passenger(passenger_id: int):
    """Delete a passenger."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM Passenger WHERE PassengerID = ?', (passenger_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Passenger not found"}), 404
        
        cursor.execute('DELETE FROM Passenger WHERE PassengerID = ?', (passenger_id,))
        conn.commit()
        
        return jsonify({"message": "Passenger deleted successfully"}), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in delete_passenger: {str(e)}")
        return jsonify({"error": "Failed to delete passenger"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/cards', methods=['GET'])
def get_cards():
    """Get all cards."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT c.*, p.FirstName, p.LastName, ct.TypeName 
            FROM Card c
            LEFT JOIN Passenger p ON c.PassengerID = p.PassengerID
            LEFT JOIN CardType ct ON c.CardTypeID = ct.CardTypeID
        ''')
        cards = [dict(row) for row in cursor.fetchall()]
        return jsonify(cards), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/cards', methods=['POST'])
def create_card():
    """Create a new card."""
    conn = None
    try:
        data = request.get_json()
        required_fields = ['CardNumber', 'PassengerID', 'CardTypeID']
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify passenger and card type exist
        cursor.execute('SELECT COUNT(*) FROM Passenger WHERE PassengerID = ?', (data['PassengerID'],))
        if cursor.fetchone()[0] == 0:
            return jsonify({"error": "Passenger not found"}), 404
            
        cursor.execute('SELECT COUNT(*) FROM CardType WHERE CardTypeID = ?', (data['CardTypeID'],))
        if cursor.fetchone()[0] == 0:
            return jsonify({"error": "Card type not found"}), 404
        
        cursor.execute('''
            INSERT INTO Card (CardNumber, Balance, IssueDate, Status, PassengerID, CardTypeID)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['CardNumber'], data.get('Balance', 0.0), 
              datetime.now().strftime('%Y-%m-%d'), 
              data.get('Status', 'Active'), 
              data['PassengerID'], data['CardTypeID']))
        
        conn.commit()
        card_id = cursor.lastrowid
        logger.info(f"Created card with ID {card_id}")
        
        return jsonify({"message": "Card created successfully", "CardID": card_id}), 201
        
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "Card number already exists"}), 409
        logger.error(f"Integrity error in create_card: {str(e)}")
        return jsonify({"error": "Database integrity error"}), 500
    except Exception as e:
        logger.error(f"Error in create_card: {str(e)}")
        return jsonify({"error": "Failed to create card"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/cards/<int:card_id>', methods=['PUT'])
def update_card(card_id: int):
    """Update an existing card."""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM Card WHERE CardID = ?', (card_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Card not found"}), 404
        
        update_fields = []
        params = []
        
        if 'Balance' in data:
            update_fields.append("Balance = ?")
            params.append(data['Balance'])
        if 'Status' in data:
            update_fields.append("Status = ?")
            params.append(data['Status'])
            
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400
            
        params.append(card_id)
        update_query = f"UPDATE Card SET {', '.join(update_fields)} WHERE CardID = ?"
        
        cursor.execute(update_query, params)
        conn.commit()
        
        return jsonify({"message": "Card updated successfully"}), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in update_card: {str(e)}")
        return jsonify({"error": "Failed to update card"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id: int):
    """Delete a card."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM Card WHERE CardID = ?', (card_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Card not found"}), 404
        
        cursor.execute('DELETE FROM Card WHERE CardID = ?', (card_id,))
        conn.commit()
        
        return jsonify({"message": "Card deleted successfully"}), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in delete_card: {str(e)}")
        return jsonify({"error": "Failed to delete card"}), 500
    finally:
        if conn:
            conn.close()


@app.route('/stations', methods=['GET'])
def get_stations():
    """Get all stations."""
    conn = None
    try:
        logger.info("Attempting to fetch stations...")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Station'")
        if not cursor.fetchone():
            logger.error("Station table does not exist")
            return jsonify({"error": "Station table does not exist"}), 500
            
        # Get column names for debugging
        cursor.execute("PRAGMA table_info(Station)")
        columns = [column[1] for column in cursor.fetchall()]
        logger.info(f"Station table columns: {columns}")
        
        # Get station count
        cursor.execute("SELECT COUNT(*) FROM Station")
        count = cursor.fetchone()[0]
        logger.info(f"Found {count} stations in the database")
        
        # Fetch stations
        cursor.execute('''
            SELECT * FROM Station ORDER BY StationName
        ''')
        stations = [dict(zip(columns, row)) for row in cursor.fetchall()]
        logger.info(f"Successfully fetched {len(stations)} stations")
        return jsonify(stations), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in get_stations: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Unexpected error in get_stations: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/stations', methods=['POST'])
def create_station():
    """Create a new station."""
    conn = None
    try:
        data = request.get_json()
        required_fields = ['StationName']
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO Station (StationName, LineColor)
            VALUES (?, ?)
        ''', (data['StationName'], data.get('LineColor')))
        
        conn.commit()
        station_id = cursor.lastrowid
        logger.info(f"Created station with ID {station_id}")
        
        return jsonify({"message": "Station created successfully", "StationID": station_id}), 201
        
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "Station name already exists"}), 409
        logger.error(f"Integrity error in create_station: {str(e)}")
        return jsonify({"error": "Database integrity error"}), 500
    except Exception as e:
        logger.error(f"Error in create_station: {str(e)}")
        return jsonify({"error": "Failed to create station"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/stations/<int:station_id>', methods=['PUT'])
def update_station(station_id: int):
    """Update an existing station."""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM Station WHERE StationID = ?', (station_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Station not found"}), 404
        
        update_fields = []
        params = []
        
        if 'StationName' in data:
            update_fields.append("StationName = ?")
            params.append(data['StationName'])
        if 'LineColor' in data:
            update_fields.append("LineColor = ?")
            params.append(data['LineColor'])
            
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400
            
        params.append(station_id)
        update_query = f"UPDATE Station SET {', '.join(update_fields)} WHERE StationID = ?"
        
        cursor.execute(update_query, params)
        conn.commit()
        
        return jsonify({"message": "Station updated successfully"}), 200
        
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "Station name already exists"}), 409
        return jsonify({"error": "Database integrity error"}), 500
    except sqlite3.Error as e:
        logger.error(f"Database error in update_station: {str(e)}")
        return jsonify({"error": "Failed to update station"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/stations/<int:station_id>', methods=['DELETE'])
def delete_station(station_id: int):
    """Delete a station."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM Station WHERE StationID = ?', (station_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Station not found"}), 404
        
        cursor.execute('DELETE FROM Station WHERE StationID = ?', (station_id,))
        conn.commit()
        
        return jsonify({"message": "Station deleted successfully"}), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in delete_station: {str(e)}")
        return jsonify({"error": "Failed to delete station"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/card-types', methods=['GET'])
def get_card_types():
    """Get all card types."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM CardType ORDER BY TypeName
        ''')
        card_types = [dict(row) for row in cursor.fetchall()]
        return jsonify(card_types), 200
    except sqlite3.Error as e:
        logger.error(f"Error fetching card types: {e}")
        return jsonify({"error": "Failed to fetch card types"}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/card-types', methods=['POST'])
def create_card_type():
    """Create a new card type."""
    conn = None
    try:
        data = request.get_json()
        required_fields = ['TypeName', 'BaseFareMultiplier']
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO CardType (TypeName, BaseFareMultiplier, Description)
            VALUES (?, ?, ?)
        ''', (data['TypeName'], data['BaseFareMultiplier'], data.get('Description', '')))
        
        conn.commit()
        card_type_id = cursor.lastrowid
        logger.info(f"Created card type with ID {card_type_id}")
        
        return jsonify({"message": "Card type created successfully", "CardTypeID": card_type_id}), 201
        
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "Card type name already exists"}), 409
        logger.error(f"Integrity error in create_card_type: {str(e)}")
        return jsonify({"error": "Database integrity error"}), 500
    except Exception as e:
        logger.error(f"Error in create_card_type: {str(e)}")
        return jsonify({"error": "Failed to create card type"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/card-types/<int:card_type_id>', methods=['PUT'])
def update_card_type(card_type_id: int):
    """Update an existing card type."""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM CardType WHERE CardTypeID = ?', (card_type_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Card type not found"}), 404
        
        update_fields = []
        params = []
        
        if 'TypeName' in data:
            update_fields.append("TypeName = ?")
            params.append(data['TypeName'])
        if 'BaseFareMultiplier' in data:
            update_fields.append("BaseFareMultiplier = ?")
            params.append(data['BaseFareMultiplier'])
        if 'Description' in data:
            update_fields.append("Description = ?")
            params.append(data['Description'])
            
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400
            
        params.append(card_type_id)
        update_query = f"UPDATE CardType SET {', '.join(update_fields)} WHERE CardTypeID = ?"
        
        cursor.execute(update_query, params)
        conn.commit()
        
        return jsonify({"message": "Card type updated successfully"}), 200
        
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "Card type name already exists"}), 409
        return jsonify({"error": "Database integrity error"}), 500
    except sqlite3.Error as e:
        logger.error(f"Database error in update_card_type: {str(e)}")
        return jsonify({"error": "Failed to update card type"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/card-types/<int:card_type_id>', methods=['DELETE'])
def delete_card_type(card_type_id: int):
    """Delete a card type."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM CardType WHERE CardTypeID = ?', (card_type_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Card type not found"}), 404
        
        cursor.execute('DELETE FROM CardType WHERE CardTypeID = ?', (card_type_id,))
        conn.commit()
        
        return jsonify({"message": "Card type deleted successfully"}), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in delete_card_type: {str(e)}")
        return jsonify({"error": "Failed to delete card type"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/trips', methods=['GET'])
def get_trips():
    """Get all trips with related information."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
        SELECT
            t.TripID, t.EntryTime, t.ExitTime, t.FareAmount,
            c.CardNumber, p.PassengerID, p.FirstName, p.LastName,
            es.StationID as EntryStationID, es.StationName as EntryStation,
            xs.StationID as ExitStationID, xs.StationName as ExitStation
        FROM Trip t
        JOIN Card c ON t.CardID = c.CardID
        JOIN Passenger p ON c.PassengerID = p.PassengerID
        LEFT JOIN Station es ON t.EntryStationID = es.StationID
        LEFT JOIN Station xs ON t.ExitStationID = xs.StationID
        ORDER BY t.EntryTime DESC
        """
        cursor.execute(query)
        trips = [dict(row) for row in cursor.fetchall()]
        return jsonify(trips)
    except sqlite3.Error as e:
        logger.error(f"Error fetching trips: {e}")
        return jsonify({"error": "Failed to fetch trips"}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/trips', methods=['POST'])
def create_trip():
    """Create a new trip entry."""
    try:
        data = request.get_json()
        required_fields = ['cardId', 'entryStationId']
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        trip_data = {
            'EntryTime': data.get('entryTime', datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
            'ExitTime': data.get('exitTime'),
            'FareAmount': float(data.get('fareAmount', 0.0)),
            'CardID': int(data['cardId']),
            'EntryStationID': int(data['entryStationId']),
            'ExitStationID': int(data['exitStationId']) if data.get('exitStationId') else None
        }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
        INSERT INTO Trip (EntryTime, ExitTime, FareAmount, CardID, EntryStationID, ExitStationID)
        VALUES (:EntryTime, :ExitTime, :FareAmount, :CardID, :EntryStationID, :ExitStationID)
        """
        
        cursor.execute(query, trip_data)
        trip_id = cursor.lastrowid
        conn.commit()
        
        return jsonify({"id": trip_id, "message": "Trip recorded successfully"}), 201
        
    except ValueError as e:
        logger.error(f"Invalid input: {e}")
        return jsonify({"error": "Invalid input data"}), 400
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        return jsonify({"error": "Failed to record trip"}), 500
    except Exception as e:
        logger.error(f"Error creating trip: {e}")
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if 'conn' in locals():
            conn.close()

# ==================== MAIN ====================

def initialize_database():
    """Initialize the database if it doesn't exist."""
    try:
        # Create database directory if it doesn't exist
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        cursor.executescript('''
            CREATE TABLE IF NOT EXISTS CardType (
                CardTypeID INTEGER PRIMARY KEY AUTOINCREMENT,
                TypeName TEXT NOT NULL UNIQUE,
                BaseFareMultiplier REAL NOT NULL DEFAULT 1.0,
                Description TEXT
            );
            
            CREATE TABLE IF NOT EXISTS Passenger (
                PassengerID INTEGER PRIMARY KEY AUTOINCREMENT,
                FirstName TEXT NOT NULL,
                LastName TEXT NOT NULL,
                Email TEXT UNIQUE NOT NULL,
                PhoneNumber TEXT,
                RegistrationDate TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS Station (
                StationID INTEGER PRIMARY KEY AUTOINCREMENT,
                StationName TEXT NOT NULL UNIQUE,
                LineColor TEXT
            );
            
            CREATE TABLE IF NOT EXISTS Card (
                CardID INTEGER PRIMARY KEY AUTOINCREMENT,
                CardNumber TEXT UNIQUE NOT NULL,
                Balance REAL NOT NULL DEFAULT 0.0,
                IssueDate TEXT NOT NULL,
                Status TEXT NOT NULL CHECK(Status IN ('Active', 'Inactive', 'Blocked')),
                PassengerID INTEGER,
                CardTypeID INTEGER,
                FOREIGN KEY (PassengerID) REFERENCES Passenger(PassengerID),
                FOREIGN KEY (CardTypeID) REFERENCES CardType(CardTypeID)
            );
            
            CREATE TABLE IF NOT EXISTS [Transaction] (
                TransactionID INTEGER PRIMARY KEY AUTOINCREMENT,
                TransactionType TEXT NOT NULL,
                Amount REAL NOT NULL,
                TransactionDate TEXT NOT NULL,
                CardID INTEGER,
                FOREIGN KEY (CardID) REFERENCES Card(CardID)
            );
            
            CREATE TABLE IF NOT EXISTS FareRule (
                FareRuleID INTEGER PRIMARY KEY AUTOINCREMENT,
                StartStationID INTEGER,
                EndStationID INTEGER,
                FareType TEXT,
                FareAmount REAL NOT NULL,
                FOREIGN KEY (StartStationID) REFERENCES Station(StationID),
                FOREIGN KEY (EndStationID) REFERENCES Station(StationID),
                UNIQUE (StartStationID, EndStationID, FareType)
            );
            
            CREATE TABLE IF NOT EXISTS Trip (
                TripID INTEGER PRIMARY KEY AUTOINCREMENT,
                EntryTime TEXT NOT NULL,
                ExitTime TEXT,
                FareAmount REAL,
                CardID INTEGER NOT NULL,
                EntryStationID INTEGER NOT NULL,
                ExitStationID INTEGER,
                FOREIGN KEY (CardID) REFERENCES Card(CardID),
                FOREIGN KEY (EntryStationID) REFERENCES Station(StationID),
                FOREIGN KEY (ExitStationID) REFERENCES Station(StationID)
            );
        ''')
        
        # Insert default card types if they don't exist
        cursor.execute('SELECT COUNT(*) FROM CardType')
        if cursor.fetchone()[0] == 0:
            cursor.executemany(
                'INSERT INTO CardType (TypeName, BaseFareMultiplier, Description) VALUES (?, ?, ?)',
                [
                    ('Regular', 1.0, 'Standard fare card'),
                    ('Student', 0.5, 'Discounted fare for students'),
                    ('Senior', 0.7, 'Discounted fare for senior citizens'),
                    ('Monthly', 0.9, 'Monthly subscription card')
                ]
            )
        
        # Insert sample stations if they don't exist
        cursor.execute('SELECT COUNT(*) FROM Station')
        station_count = cursor.fetchone()[0]
        logger.info(f"Found {station_count} existing stations in the database")
        
        if station_count == 0:
            stations = [
                ('Central Station', 'Blue'),
                ('Downtown', 'Blue'),
                ('University', 'Red'),
                ('City Park', 'Green'),
                ('Terminal', 'Red')
            ]
            logger.info("Inserting sample stations...")
            try:
                cursor.executemany(
                    'INSERT INTO Station (StationName, LineColor) VALUES (?, ?)',
                    stations
                )
                logger.info(f"Successfully inserted {len(stations)} stations")
                
                # Verify the insertion
                cursor.execute('SELECT * FROM Station')
                inserted_stations = cursor.fetchall()
                logger.info(f"Current stations in database: {inserted_stations}")
                
            except sqlite3.Error as e:
                logger.error(f"Error inserting stations: {e}")
                raise
        
        conn.commit()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
    finally:
        conn.close()

@app.route('/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions with related card and passenger information."""
    conn = None
    try:
        logger.info("Fetching transactions...")
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get transactions with card and passenger details
        cursor.execute('''
            SELECT 
                t.TransactionID,
                t.TransactionType,
                t.Amount,
                t.TransactionDate,
                c.CardNumber,
                p.FirstName || ' ' || p.LastName as PassengerName,
                p.PassengerID
            FROM [Transaction] t
            JOIN Card c ON t.CardID = c.CardID
            JOIN Passenger p ON c.PassengerID = p.PassengerID
            ORDER BY t.TransactionDate DESC
        ''')
        
        transactions = [dict(row) for row in cursor.fetchall()]
        logger.info(f"Fetched {len(transactions)} transactions")
        return jsonify(transactions), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in get_transactions: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Unexpected error in get_transactions: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/fare-rules', methods=['GET'])
def get_fare_rules():
    """Get all fare rules with station details."""
    conn = None
    try:
        logger.info("Fetching fare rules...")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get fare rules with station names
        cursor.execute('''
            SELECT 
                fr.FareRuleID,
                fr.FareType,
                fr.FareAmount,
                fr.StartStationID,
                s1.StationName as StartStationName,
                fr.EndStationID,
                s2.StationName as EndStationName
            FROM FareRule fr
            JOIN Station s1 ON fr.StartStationID = s1.StationID
            JOIN Station s2 ON fr.EndStationID = s2.StationID
            ORDER BY fr.FareRuleID
        ''')
        
        fare_rules = [dict(row) for row in cursor.fetchall()]
        logger.info(f"Fetched {len(fare_rules)} fare rules")
        return jsonify(fare_rules), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in get_fare_rules: {str(e)}")
        return jsonify({"error": f"Database error: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"Unexpected error in get_fare_rules: {str(e)}")
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/fare-rules', methods=['POST'])
def create_fare_rule():
    """Create a new fare rule."""
    conn = None
    try:
        data = request.get_json()
        required_fields = ['StartStationID', 'EndStationID', 'FareType', 'FareAmount']
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if stations exist
        cursor.execute('SELECT COUNT(*) FROM Station WHERE StationID IN (?, ?)', 
                      (data['StartStationID'], data['EndStationID']))
        if cursor.fetchone()[0] != 2:
            return jsonify({"error": "One or both stations not found"}), 404
        
        # Insert new fare rule
        cursor.execute('''
            INSERT INTO FareRule (StartStationID, EndStationID, FareType, FareAmount)
            VALUES (?, ?, ?, ?)
        ''', (data['StartStationID'], data['EndStationID'], data['FareType'], data['FareAmount']))
        
        conn.commit()
        fare_rule_id = cursor.lastrowid
        logger.info(f"Created fare rule with ID {fare_rule_id}")
        
        return jsonify({"message": "Fare rule created successfully", "FareRuleID": fare_rule_id}), 201
        
    except sqlite3.IntegrityError as e:
        if 'UNIQUE constraint failed' in str(e):
            return jsonify({"error": "A fare rule with these parameters already exists"}), 409
        logger.error(f"Integrity error in create_fare_rule: {str(e)}")
        return jsonify({"error": "Database integrity error"}), 500
    except Exception as e:
        logger.error(f"Error in create_fare_rule: {str(e)}")
        return jsonify({"error": "Failed to create fare rule"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/fare-rules/<int:fare_rule_id>', methods=['PUT'])
def update_fare_rule(fare_rule_id: int):
    """Update an existing fare rule."""
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if fare rule exists
        cursor.execute('SELECT * FROM FareRule WHERE FareRuleID = ?', (fare_rule_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Fare rule not found"}), 404
        
        # Update fare rule
        update_fields = []
        params = []
        
        if 'FareType' in data:
            update_fields.append("FareType = ?")
            params.append(data['FareType'])
            
        if 'FareAmount' in data:
            update_fields.append("FareAmount = ?")
            params.append(data['FareAmount'])
            
        if not update_fields:
            return jsonify({"error": "No valid fields to update"}), 400
            
        params.append(fare_rule_id)
        update_query = f"""
            UPDATE FareRule 
            SET {', '.join(update_fields)}
            WHERE FareRuleID = ?
        """
        
        cursor.execute(update_query, params)
        conn.commit()
        
        return jsonify({"message": "Fare rule updated successfully"}), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in update_fare_rule: {str(e)}")
        return jsonify({"error": "Failed to update fare rule"}), 500
    finally:
        if conn:
            conn.close()

@app.route('/fare-rules/<int:fare_rule_id>', methods=['DELETE'])
def delete_fare_rule(fare_rule_id: int):
    """Delete a fare rule."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if fare rule exists
        cursor.execute('SELECT * FROM FareRule WHERE FareRuleID = ?', (fare_rule_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Fare rule not found"}), 404
        
        # Delete fare rule
        cursor.execute('DELETE FROM FareRule WHERE FareRuleID = ?', (fare_rule_id,))
        conn.commit()
        
        return jsonify({"message": "Fare rule deleted successfully"}), 200
        
    except sqlite3.Error as e:
        logger.error(f"Database error in delete_fare_rule: {str(e)}")
        return jsonify({"error": "Failed to delete fare rule"}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    # Initialize the database
    initialize_database()
    
    # Print all registered routes
    print("\n=== Registered Routes ===")
    for rule in app.url_map.iter_rules():
        print(f"{rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
    print("=======================\n")
    
    # Start the Flask application
    logger.info("Starting Flask application...")
    app.run(host='0.0.0.0', port=5000, debug=True)
