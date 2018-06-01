import React, { Component } from 'react';
var AppDispatcher = require('../../../AppDispatcher');

import {ResponsiveBar} from '@nivo/bar';

import DashboardAbstract, { neo4jSession, databaseCredentialsProvided } from '../AbstractDashboardComponent';

class FilesPerAuthor extends DashboardAbstract {

    constructor(props) {
        super(props);

        this.state = {
            startDate: '1970-01-01',
            endDate: '3000-12-31',
            filesPerAuthor: []
        };
    }

    componentWillMount() {
      super.componentWillMount();
    }

    componentDidMount() {
      super.componentDidMount();
      if (databaseCredentialsProvided) {
        this.readFilesPerAuthor();
      }
    }

    componentWillUnmount() {
      super.componentWillUnmount();
    }

    readFilesPerAuthor() {
      var aggregatedData = [];
      var thisBackup = this; //we need this because this is undefined in then() but we want to access the current state
      var recordCount = 0;

      neo4jSession.run(
        'MATCH (a:Author)-[:COMMITTED]->(c:Commit)-[:CONTAINS_CHANGE]->(:Change)-[:MODIFIES]->(file:File) ' +
        'WHERE NOT c:Merge AND c.date >= {startDate} AND c.date <= {endDate} ' +
        'RETURN a.name as author, count(file) as files ' +
        'ORDER BY files DESC',
          {
              startDate: this.state.startDate,
              endDate: this.state.endDate
          }
      ).then(function (result) {
        result.records.forEach(function (record) {
          var recordConverted = {
            "author": record.get(0),
            "files": record.get(1).low
          };

          if (recordCount < 20) { //above 20 records makes the chart unreadable
            aggregatedData.push(recordConverted);
          }
          recordCount++;
        });
      }).then( function(context) {
        thisBackup.setState({filesPerAuthor: aggregatedData.reverse()}); //reverse reverses the order of the array (because the chart is flipped this is neccesary)
      }).catch(function (error) {
          console.log(error);
      });
    }

    handleAction(event) {
        console.log(event);
        var action = event.action;
        switch (action.actionType) {
            case 'DATERANGEPICKER_MODIFIED':
                this.setState({
                    startDate: action.data.displayFrom,
                    endDate: action.data.displayTo,
                });
                this.readFilesPerAuthor();
                break;
        }
    }


    render() {
        var redirect = super.render();
        if (redirect.length > 0) {
          return(redirect);
        }

        if (this.state.filesPerAuthor.length === 0) {
            return '';
        }

        return (
          <div>
            <div style={{height: "600px"}}>
              <ResponsiveBar
                onClick={ function(event) {
                  AppDispatcher.handleAction({
                    actionType: 'SELECT_FILESPERAUTHOR',
                    data: event
                  });
                } }
                data={this.state.filesPerAuthor}
                keys={[
                  "commits",
                  "files"
                ]}
                indexBy="author"
                margin={{
                  "top": 0,
                  "right": 50,
                  "bottom": 50,
                  "left": 150
                }}
                padding={0.05}
                groupMode="stacked"
                layout="horizontal"
                colors="nivo"
                colorBy="id"
                defs={[
                  {
                    "id": "dots",
                    "type": "patternDots",
                    "background": "inherit",
                    "color": "#38bcb2",
                    "size": 4,
                    "padding": 1,
                    "stagger": true
                  },
                  {
                    "id": "lines",
                    "type": "patternLines",
                    "background": "inherit",
                    "color": "#eed312",
                    "rotation": -45,
                    "lineWidth": 6,
                    "spacing": 10
                  }
                ]}
                borderColor="inherit:darker(1.6)"
                axisBottom={{
                  "orient": "bottom",
                  "tickSize": 5,
                  "tickPadding": 15,
                  "tickRotation": 0,
                  "legend": "# Files",
                  "legendPosition": "center",
                  "legendOffset": 46
                }}
                axisLeft={{
                  "orient": "left",
                  "tickSize": 5,
                  "tickPadding": 5,
                  "tickRotation": 0,
                  "legend": "Author",
                  "legendPosition": "center",
                  "legendOffset": -140
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor="inherit:darker(1.6)"
                animate={true}
                motionStiffness={90}
                motionDamping={15}
              />
            </div>
          </div>
        )
    }
}

export default FilesPerAuthor;