var Rx = require('rx');
var React = require('react');

var getYOffset = function () {
  return window.pageYOffset;
};

var initialScrollSubject = (new Rx.ReplaySubject(1));
initialScrollSubject.onNext(getYOffset());

var yOffsetStream = initialScrollSubject.merge(
  Rx.Observable.fromEvent(window, 'scroll').map(getYOffset)
);

var getWindowHeight = function () {
  return window.innerHeight;
};

var initialHeightSubject = (new Rx.ReplaySubject(1));
initialHeightSubject.onNext(getWindowHeight());

var windowHeightStream = initialHeightSubject.merge(
  Rx.Observable.fromEvent(window, 'resize').map(getWindowHeight)
);

var Phonebook = React.createClass({
  getInitialState: function () {
    return {
      visibleIndices: []
    };
  },

  render: function () {
    var {totalResults, rowHeight} = this.props;
    var elements = this.state.visibleIndices.map(function (index, i) {
      return (
        <li
          key={i}
          style={{
            top: index * rowHeight
          }}>
          {index}
        </li>
      );
    });

    return (
      <div>
        <ul
          className="phonebook"
          style={{
            height: totalResults * rowHeight
          }}>
          {elements}
        </ul>
      </div>
    );
  },

  componentDidMount: function () {
    var {rowHeight, totalResults} = this.props;

    var firstVisibleRowStream = yOffsetStream.map(function (y) {
      return Math.floor(y / rowHeight);
    }).distinctUntilChanged();

    var windowHeightStream = this.props.windowHeightStream.distinctUntilChanged();
    var rowCountStream = windowHeightStream.map(function (screenHeight) {
      return Math.ceil(screenHeight / rowHeight);
    }).distinctUntilChanged();

    var visibleIndicesStream = Rx.Observable.combineLatest(
      firstVisibleRowStream,
      rowCountStream,
      function (firstRow, rowCount) {
        var visibleIndices = [];

        // Limit the number of visible rows
        var lastRow = firstRow + rowCount + 1;
        if (lastRow > totalResults) {
          firstRow -= lastRow - totalResults;
        }

        for (var i = 0; i <= rowCount; i++) { visibleIndices.push(i + firstRow) }
        return visibleIndices;
      }
    );

    this.visibleIndicesSubscription = visibleIndicesStream.subscribe((indices) => {
      this.setState({
        visibleIndices: indices
      });
    });
  }
});

React.render(
  <Phonebook
    totalResults={10000}
    rowHeight={30}
    yOffsetStream={yOffsetStream}
    windowHeightStream={windowHeightStream}
  />,
  document.getElementById('app')
);
