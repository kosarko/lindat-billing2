const config = require('config');
const promise = require('bluebird');
const logger = require('../logger');
const db = require('./connection');


exports.get = () => {
  logger.trace();
  return new promise((resolve, reject) => {
    db.any('SELECT * FROM log_files')
        .then(data => {
            logger.trace();
            resolve(data); // data
        })
        .catch(error => {
          logger.trace();
          reject({
              state: 'failure',
              reason: 'Database error',
              extra: error
          });
        });
  });
};


exports.getLogFile = (fileName, firstLineChecksum) => {
  logger.trace();
  return new promise((resolve, reject) => {
    db.one('SELECT * FROM log_files WHERE file_name = $1 AND first_line_checksum = $2', [fileName, firstLineChecksum])
        .then(data => {
            logger.trace();
            logger.debug('File exists in DB ' + fileName);
            resolve(data); // data
        })
        .catch(error => {
          logger.trace(fileName);
          reject({
              state: 'failure',
              reason: 'Database error',
              extra: error
          });
        });
  });
};


exports.addLogFile = (fileName, firstLineChecksum) => {
  logger.trace();
  return new promise((resolve, reject) => {
    db.one('INSERT INTO log_files(file_name, first_line_checksum) VALUES($1, $2) RETURNING file_id', [fileName, firstLineChecksum])
        .then(data => {
            logger.trace();
            logger.debug('Initialized file in DB ' + fileName);
            resolve(data); // data
        })
        .catch(error => {
          logger.trace(fileName);
          reject({
              state: 'failure',
              reason: 'Database error',
              extra: error
          });
        });
  });
};

exports.updateLogFile = (fileId, lastReadLineChecksum, linesRead) => {
  logger.trace();
  return new promise((resolve, reject) => {
    db.one('UPDATE log_files SET last_read_line_checksum = $2, lines_read = $3 WHERE file_id = $1 RETURNING file_id', [fileId, lastReadLineChecksum, linesRead])
        .then(data => {
            logger.trace();
            resolve(data); // data
        })
        .catch(error => {
          logger.trace();
          reject({
              state: 'failure',
              reason: 'Database error',
              extra: error
          });
        });
  });
};

exports.setLogTail = (fileId, tail) => { 
  logger.trace();
  return new promise((resolve, reject) => {
    db.one('UPDATE log_files SET tail = $2, WHERE file_id = $1 RETURNING file_id', [fileId, tail])
        .then(data => {
            logger.trace();
            resolve(data); // data
        })
        .catch(error => {
          logger.trace();
          reject({
              state: 'failure',
              reason: 'Database error',
              extra: error
          });
        });
  });  
};

exports.checkLogEntry = (obj) => {
  return new promise((resolve, reject) => {
    db.one('SELECT * FROM log_file_entries WHERE file_id = $1 AND line_number = $2 AND line_checksum = $3', [obj.file_id, obj.line_number, obj.line_checksum])
        .then(data => {
            logger.trace();
            logger.debug('Line exists in DB ');
            resolve(data); // data
        })
        .catch(error => {
          //logger.trace(obj.file_id);
          reject({
              state: 'failure',
              reason: 'Database error',
              extra: error
          });
        });
  });  
}

exports.addLogEntries = (obj) => {
  //logger.trace();
  return new promise((resolve, reject) => {
    db.one('INSERT INTO log_file_entries('
        +'file_id, service_id, line_number, line_checksum, remote_addr, remote_user, time_local, method, request, protocol, status, body_bytes_sent, http_referer, http_user_agent)'
        + 'VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING time_local',
        [obj.file_id, obj.service_id, obj.line_number, obj.line_checksum, obj.remote_addr, obj.remote_user, obj.time_local, obj.method, obj.request, obj.protocol, obj.status, obj.body_bytes_sent, obj.http_referer, obj.http_user_agent])
        .then(data => {
            //logger.trace();
            resolve(data); // data
        })
        .catch(error => {
          logger.debug(obj.file_id, obj);
          reject({
              state: 'failure',
              reason: 'Database error',
              extra: error
          });
        });
  });
};

exports.getMonthlyCountsByService = (year) => {
  logger.trace();
  return new promise((resolve, reject) => {
    db.any("SELECT s.name AS name, s.color AS color, date_part('day', l.time_local) AS month, count(1) AS count FROM log_file_entries l, services s WHERE l.service_id=s.service_id AND date_part('year', l.time_local) = date_part('year', timestamp $1) AND date_part('month', l.time_local) = date_part('month', timestamp $1) GROUP BY name, color, month", [year])
        .then(data => {
            logger.trace();
            resolve(data); // data
        })
        .catch(error => {
          logger.trace();
          reject({
              state: 'failure',
              reason: 'Database error',
              extra: error
          });
        });
  });
};