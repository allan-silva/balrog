angular.module("app").controller("ReleaseScheduledChangesController",
function($scope, $routeParams, $location, $timeout, Search, $modal, $route, Releases, ReleasesReadonly, Permissions, Page) {

  Page.setTitle('Scheduled Release Changes');

  $scope.loading = true;
  $scope.failed = false;
  $scope.current_user = null;
  $scope.user_roles = [];

  $scope.sc_id = $routeParams.sc_id;

  $scope.current_user = localStorage.getItem("username");
  Permissions.getUserInfo($scope.current_user)
  .then(function(response) {
    $scope.user_roles = Object.keys(response["roles"]);
  },
  function(response) {
    sweetAlert(
      "Failed to load current user Roles:",
      response
    );
  });

  function loadPage(newPage) {
    Releases.getScheduledChangeHistory($scope.sc_id, $scope.pageSize, newPage)
    .success(function(response) {
      // it's the same release, but this works
      $scope.scheduled_changes = response.revisions;
      $scope.scheduled_changes_count = response.count;
    })
    .error(function() {
      console.error(arguments);
      $scope.failed = true;
    })
    .finally(function() {
      $scope.loading = false;
    });
  }

  $scope.openDataModal = function(release) { 
    var modalInstance = $modal.open({
      templateUrl: 'release_scheduled_change_data_modal.html',
      controller: 'ReleaseScheduledChangeDataCtrl',
      size: 'lg',
      backdrop: 'static',
      resolve: {
        release: function () {
          return release;
        },
        diff: function() {
          return false;
        }
      }
    });
  };
  /* End openDataModal */

  $scope.openDiffModal = function(sc) {
        var modalInstance = $modal.open({
          templateUrl: 'release_data_modal.html',
          controller: 'ScheduledReleaseDiffCtrl',
          size: 'lg',
          backdrop: 'static',
          resolve: {
            sc: function () {
              return sc;
            },
            diff: function() {
              return true;
            }
          }
        });
      };

  function timestampToDate(when) {
    // "when" is a unix timestamp, but it's much easier to work with Date objects,
    // so we convert it to that before rendering.
    return when ? new Date(when) : null;
  }

  function mergeScheduledChangesReleaseReadonly(releaseReadonlySC) {
    if(!$scope.scheduled_changes) {
      $scope.scheduled_changes = [];
    }
    releaseReadonlySC.isReadonlyStateChange = true;
    $scope.scheduled_changes.push(releaseReadonlySC);
  }

  function handleLoadingError() {
    console.error(arguments);
    $scope.failed = true;
  }

  if ($scope.sc_id) {
    $scope.$watch("currentPage", function(newPage) {
      loadPage(newPage);
    });
  } else {
    Releases.getScheduledChanges()
      .then(function(response) {
        $scope.scheduled_changes = response.data.scheduled_changes.map(function(sc) {
          sc.when = timestampToDate(sc.when);
          return sc;
        });
      },handleLoadingError)
      .then(function() {
        ReleasesReadonly.scheduledChanges()
          .then(function(response) {
            response.data.scheduled_changes.forEach(mergeScheduledChangesReleaseReadonly);
          }, handleLoadingError)
          .then(function() {
            $scope.scheduled_changes
              .filter(function(sc) {
                return sc.isReadonlyStateChange;
              })
              .forEach(function(sc) {
                Releases.getReleasesByName(sc.release_name)
                  .then(function(response) {
                    releases = response.data.releases;
                    if(releases) {
                      sc.product = releases[0].product;
                    }                    
                  }, handleLoadingError);
              });
          }, handleLoadingError)
          .then(function() {
            $scope.scheduled_changes.forEach(function(sc) {
              sc.getName = function() {
                if(this.isReadonlyStateChange) {
                  return this.release_name;
                } else {
                  return this.name;
                }
              };
            });
          });
      })
      .finally(function() {
        $scope.loading = false;
      });
}
  $scope.$watch("ordering_str", function(value) {
    $scope.ordering = value.value.split(",");
  });
  if ($scope.sc_id) {
    $scope.ordering_options = [
      {
        text: "Data Version",
        value: "-data_version"
      },
    ];
  } else {
  $scope.ordering_options = [
    {
      text: "When",
      value: "when"
    },
    {
      text: "Product",
      value: "product"
    },
    {
      text: "Name",
      value: "name"
    },
  ];
  }

  $scope.ordering_str = $scope.ordering_options[0];

  $scope.currentPage = 1;
  $scope.pageSize = 10;

  $scope.state_filter = [
    {
      text: "Active",
      value: "active",
    },
    {
      text: "Completed",
      value: "complete",
    },
  ];
  $scope.state_str = $scope.state_filter[0];

  $scope.filterBySelect = function(sc) {
    if($scope.sc_id) {
      return true;
    }
    if ($scope.state_str.value === "complete" && sc.complete) {
      return true;
    }
    else if ($scope.state_str.value === "active" && !sc.complete) {
      return true;
    }
    return false;
  };

  $scope.openNewScheduledReleaseChangeModal = function() {

    var modalInstance = $modal.open({
      templateUrl: 'release_scheduled_change_modal.html',
      controller: 'NewReleaseScheduledChangeCtrl',
      size: 'lg',
      backdrop: 'static',
      resolve: {
        scheduled_changes: function() {
          return $scope.scheduled_changes;
        },
        sc: function() {
          // blank new default release
          return {
            name: '',
            product: '',
            change_type: 'insert',
          };
        }
      }
    });
  };

  $scope.signoff = function(sc) {
    var modalInstance = $modal.open({
      templateUrl: "signoff_modal.html",
      controller: "SignoffCtrl",
      backdrop: "static",
      resolve: {
        object_name: function() {
          return sc.isReadonlyStateChange ? "ReleasesReadonly" : "Release";
        },
        service: function() {
          return sc.isReadonlyStateChange ? ReleasesReadonly : Releases;
        },
        current_user: function() {
          return $scope.current_user;
        },
        user_roles: function() {
          return $scope.user_roles;
        },
        required_signoffs: function () {
          return sc["required_signoffs"];
        },
        sc: function() {
          return sc;
        },
        pk: function() {
          return {"name": sc.getName()};
        },
        // todo: add more stuff here
        data: function() {
          return {
            "product": sc["product"],
          };
        },
      }
    });
  };

  $scope.revokeSignoff = function(sc) {
    $modal.open({
      templateUrl: "revoke_signoff_modal.html",
      controller: "RevokeSignoffCtrl",
      backdrop: "static",
      resolve: {
        object_name: function() {
          return sc.isReadonlyStateChange ? "ReleasesReadonly" : "Release";
        },
        service: function() {
          return sc.isReadonlyStateChange ? ReleasesReadonly : Releases;
        },
        current_user: function() {
          return $scope.current_user;
        },
        sc: function() {
          return sc;
        },
        pk: function() {
          return {"name": sc.getName()};
        },
        data: function() {
          return {
            "product": sc["product"],
          };
        },
      }
    });
  };

  $scope.openUpdateModal = function(sc) {
    var modalInstance = $modal.open({
      templateUrl: "release_scheduled_change_modal.html",
      controller: "EditReleaseScheduledChangeCtrl",
      size: 'lg',
      backdrop: 'static',
      resolve: {
        sc: function() {
          sc.when = new Date(sc.when);
          return sc;
        }
      }
    });
  };

  $scope.openDeleteModal = function(sc) {
    var modalInstance = $modal.open({
      templateUrl: "release_scheduled_change_delete_modal.html",
      controller: "DeleteReleaseScheduledChangeCtrl",
      backdrop: 'static',
      resolve: {
        sc: function() {
          return sc;
        },
        object_name: function() {
          return sc.isReadonlyStateChange ? "ReleasesReadonly" : "Release";
        },
        service: function() {
          return sc.isReadonlyStateChange ? ReleasesReadonly : Releases;
        },
        scheduled_changes: function() {
          return $scope.scheduled_changes;
        }
      }
    });
  };
});
