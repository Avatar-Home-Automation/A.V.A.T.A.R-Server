(function() {
  var Base, Repo,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  Base = require('./base');

  Repo = (function(superClass) {
    extend(Repo, superClass);

    function Repo(name, client) {
      this.name = name;
      this.client = client;
    }

    Repo.prototype.info = function(cb) {
      return this.client.get("/repos/" + this.name, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo info error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.update = function(info, cb) {
      return this.client.patch("/repos/" + this.name, info, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo update error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.collaborators = function(cbParamOrUser, cb) {
      var param;
      if ((cb != null) && typeof cbParamOrUser !== 'function' && typeof cbParamOrUser !== 'object') {
        return this.hasCollaborator(cbParamOrUser, cb);
      } else {
        if (cb) {
          param = cbParamOrUser;
        } else {
          cb = cbParamOrUser;
          param = {};
        }
        return this.client.getOptions("/repos/" + this.name + "/collaborators", {
          headers: {
            Accept: 'application/vnd.github.ironman-preview+json'
          }
        }, param, function(err, s, b, h) {
          if (err) {
            return cb(err);
          }
          if (s !== 200) {
            return cb(new Error("Repo collaborators error"));
          } else {
            return cb(null, b, h);
          }
        });
      }
    };

    Repo.prototype.addCollaborator = function(user, cbOrOptions, cb) {
      var param;
      if ((cb == null) && cbOrOptions) {
        cb = cbOrOptions;
        param = {};
      } else if (typeof cbOrOptions === 'object') {
        param = cbOrOptions;
      }
      return this.client.put("/repos/" + this.name + "/collaborators/" + user, param, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 204) {
          return cb(new Error("Repo addCollaborator error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.removeCollaborator = function(user, cb) {
      return this.client.del("/repos/" + this.name + "/collaborators/" + user, null, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 204) {
          return cb(new Error("Repo removeCollaborator error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.hasCollaborator = function(user, cb) {
      return this.client.get("repos/" + this.name + "/collaborators/" + user, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        return cb(null, s === 204, h);
      });
    };

    Repo.prototype.commits = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/commits"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo commits error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.commit = function(sha, cb) {
      return this.client.get("/repos/" + this.name + "/commits/" + sha, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo commits error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.compare = function(base, head, cb) {
      return this.client.get("/repos/" + this.name + "/compare/" + base + "..." + head, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo compare error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.merge = function(obj, cb) {
      return this.client.post("/repos/" + this.name + "/merges", obj, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Merge info error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.createCommit = function(message, tree, parents, cbOrOptions, cb) {
      var param;
      if ((cb == null) && cbOrOptions) {
        cb = cbOrOptions;
        param = {
          message: message,
          parents: parents,
          tree: tree
        };
      } else if (typeof cbOrOptions === 'object') {
        param = cbOrOptions;
        param['message'] = message;
        param['parents'] = parents;
        param['tree'] = tree;
      }
      return this.client.post("/repos/" + this.name + "/git/commits", param, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createCommit error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.tags = function(cb) {
      return this.client.get("/repos/" + this.name + "/tags", function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo tags error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.releases = function(cb) {
      return this.client.get("/repos/" + this.name + "/releases", function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo releases error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.release = function(numberOrRelease, cb) {
      if (typeof cb === 'function' && typeof numberOrRelease === 'object') {
        return this.createRelease(numberOrRelease, cb);
      } else {
        return this.client.release(this.name, numberOrRelease);
      }
    };

    Repo.prototype.releaseByTag = function(tag, cb) {
      return this.client.get("/repos/" + this.name + "/releases/tags/" + tag, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo releaseByTag error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.createRelease = function(release, cb) {
      return this.client.post("/repos/" + this.name + "/releases", release, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createRelease error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.languages = function(cb) {
      return this.client.get("/repos/" + this.name + "/languages", function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo languages error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.contributors = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/contributors"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo contributors error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.contributorsStats = function(cb) {
      return this.client.get("/repos/" + this.name + "/stats/contributors", function(err, s, b, h) {
        var error;
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          error = new Error("Repo stats contributors error");
          error.status = s;
          return cb(error);
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.teams = function(cb) {
      return this.client.get("/repos/" + this.name + "/teams", function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo teams error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.branches = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/branches"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo branches error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.branch = function(branch, cb) {
      return this.client.get("/repos/" + this.name + "/branches/" + branch, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo branch error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.createReference = function(ref, sha, cb) {
      return this.client.post("/repos/" + this.name + "/git/refs", {
        ref: "refs/heads/" + ref,
        sha: sha
      }, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createReference error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.issue = function(numberOrIssue, cb) {
      if (typeof cb === 'function' && typeof numberOrIssue === 'object') {
        return this.createIssue(numberOrIssue, cb);
      } else {
        return this.client.issue(this.name, numberOrIssue);
      }
    };

    Repo.prototype.issues = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/issues"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo issues error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.createIssue = function(issue, cb) {
      return this.client.post("/repos/" + this.name + "/issues", issue, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createIssue error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.project = function(numberOrProject, cb) {
      if (typeof cb === 'function' && typeof numberOrProject === 'object') {
        return this.createProject(numberOrProject, cb);
      } else {
        return this.client.project(this.name, numberOrProject);
      }
    };

    Repo.prototype.projects = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).getAccept.apply(ref1, ["/repos/" + this.name + "/projects", 'inertia-preview'].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo projects error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.createProject = function(project, cb) {
      return this.client.post("/repos/" + this.name + "/projects", project, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createProject error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.milestone = function(numberOrMilestone, cb) {
      if (typeof cb === 'function' && typeof numberOrMilestone === 'object') {
        return this.createMilestone(numberOrMilestone, cb);
      } else {
        return this.client.milestone(this.name, numberOrMilestone);
      }
    };

    Repo.prototype.milestones = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/milestones"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo milestones error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.createMilestone = function(milestone, cb) {
      return this.client.post("/repos/" + this.name + "/milestones", milestone, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createMilestone error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.label = function(nameOrLabel, cb) {
      if (typeof cb === 'function' && typeof nameOrLabel === 'object') {
        return this.createLabel(nameOrLabel, cb);
      } else {
        return this.client.label(this.name, nameOrLabel);
      }
    };

    Repo.prototype.labels = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/labels"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo labels error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.createLabel = function(label, cb) {
      return this.client.post("/repos/" + this.name + "/labels", label, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createLabel error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.readme = function(cbOrRef, cb) {
      if ((cb == null) && cbOrRef) {
        cb = cbOrRef;
        cbOrRef = null;
      }
      if (cbOrRef) {
        cbOrRef = {
          ref: cbOrRef
        };
      }
      return this.client.get("/repos/" + this.name + "/readme", cbOrRef, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo readme error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.contents = function(path, cbOrRef, cb) {
      if ((cb == null) && cbOrRef) {
        cb = cbOrRef;
        cbOrRef = null;
      }
      if (cbOrRef) {
        cbOrRef = {
          ref: cbOrRef
        };
      }
      return this.client.get("/repos/" + this.name + "/contents/" + path, cbOrRef, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo contents error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.createContents = function(path, message, content, cbOrBranchOrOptions, cb) {
      var param;
      content = new Buffer(content).toString('base64');
      if ((cb == null) && cbOrBranchOrOptions) {
        cb = cbOrBranchOrOptions;
        cbOrBranchOrOptions = 'master';
      }
      if (typeof cbOrBranchOrOptions === 'string') {
        param = {
          branch: cbOrBranchOrOptions,
          message: message,
          content: content
        };
      } else if (typeof cbOrBranchOrOptions === 'object') {
        param = cbOrBranchOrOptions;
        param['message'] = message;
        param['content'] = content;
      }
      return this.client.put("/repos/" + this.name + "/contents/" + path, param, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createContents error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.updateContents = function(path, message, content, sha, cbOrBranchOrOptions, cb) {
      var params;
      content = new Buffer(content).toString('base64');
      if ((cb == null) && cbOrBranchOrOptions) {
        cb = cbOrBranchOrOptions;
        cbOrBranchOrOptions = 'master';
      }
      if (typeof cbOrBranchOrOptions === 'string') {
        params = {
          branch: cbOrBranchOrOptions,
          message: message,
          content: content,
          sha: sha
        };
      } else if (typeof cbOrBranchOrOptions === 'object') {
        params = cbOrBranchOrOptions;
        params['message'] = message;
        params['content'] = content;
        params['sha'] = sha;
      }
      return this.client.put("/repos/" + this.name + "/contents/" + path, params, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo updateContents error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.deleteContents = function(path, message, sha, cbOrBranch, cb) {
      if ((cb == null) && cbOrBranch) {
        cb = cbOrBranch;
        cbOrBranch = 'master';
      }
      return this.client.del("/repos/" + this.name + "/contents/" + path, {
        branch: cbOrBranch,
        message: message,
        sha: sha
      }, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo deleteContents error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.archive = function(format, cbOrRef, cb) {
      if ((cb == null) && cbOrRef) {
        cb = cbOrRef;
        cbOrRef = 'master';
      }
      return this.client.getNoFollow("/repos/" + this.name + "/" + format + "/" + cbOrRef, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 302) {
          return cb(new Error("Repo archive error"));
        } else {
          return cb(null, h['location'], h);
        }
      });
    };

    Repo.prototype.forks = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/forks"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo forks error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.blob = function(sha, cb) {
      return this.client.get("/repos/" + this.name + "/git/blobs/" + sha, {
        Accept: 'application/vnd.github.raw'
      }, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo blob error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.createBlob = function(content, encoding, cb) {
      return this.client.post("/repos/" + this.name + "/git/blobs", {
        content: content,
        encoding: encoding
      }, function(err, s, b) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createBlob error"));
        } else {
          return cb(null, b);
        }
      });
    };

    Repo.prototype.tree = function(sha, cbOrRecursive, cb) {
      var param;
      if ((cb == null) && cbOrRecursive) {
        cb = cbOrRecursive;
        cbOrRecursive = false;
      }
      if (cbOrRecursive) {
        param = {
          recursive: 1
        };
      }
      return this.client.get("/repos/" + this.name + "/git/trees/" + sha, param, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo tree error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.createTree = function(tree, cbOrBase, cb) {
      if ((cb == null) && cbOrBase) {
        cb = cbOrBase;
        cbOrBase = null;
      }
      return this.client.post("/repos/" + this.name + "/git/trees", {
        tree: tree,
        base_tree: cbOrBase
      }, function(err, s, b) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createTree error"));
        } else {
          return cb(null, b);
        }
      });
    };

    Repo.prototype.ref = function(ref, cb) {
      return this.client.get("/repos/" + this.name + "/git/refs/" + ref, function(err, s, b) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo ref error"));
        } else {
          return cb(null, b);
        }
      });
    };

    Repo.prototype.createRef = function(ref, sha, cb) {
      return this.client.post("/repos/" + this.name + "/git/refs", {
        ref: ref,
        sha: sha
      }, function(err, s, b) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createRef error"));
        } else {
          return cb(null, b);
        }
      });
    };

    Repo.prototype.updateRef = function(ref, sha, cb) {
      return this.client.post("/repos/" + this.name + "/git/refs/" + ref, {
        sha: sha
      }, function(err, s, b) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo updateRef error"));
        } else {
          return cb(null, b);
        }
      });
    };

    Repo.prototype.deleteRef = function(ref, cb) {
      return this.client.del("/repos/" + this.name + "/git/refs/" + ref, {}, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 204) {
          return cb(new Error("Ref delete error"));
        } else {
          return cb(null);
        }
      });
    };

    Repo.prototype.destroy = function(cb) {
      return this.client.del("/repos/" + this.name, {}, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 204) {
          return cb(new Error("Repo destroy error"));
        } else {
          return cb(null);
        }
      });
    };

    Repo.prototype.pr = function(numberOrPr, cb) {
      if (typeof cb === 'function' && typeof numberOrPr === 'object') {
        return this.createPr(numberOrPr, cb);
      } else {
        return this.client.pr(this.name, numberOrPr);
      }
    };

    Repo.prototype.prs = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/pulls"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo prs error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.createPr = function(pr, cb) {
      return this.client.post("/repos/" + this.name + "/pulls", pr, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createPr error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.hooks = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/hooks"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo hooks error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    Repo.prototype.hook = function(hook, cb) {
      return this.client.post("/repos/" + this.name + "/hooks", hook, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo createHook error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.deleteHook = function(id, cb) {
      return this.client.del("/repos/" + this.name + "/hooks/" + id, {}, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 204) {
          return cb(new Error("Repo deleteHook error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.statuses = function(ref, cb) {
      return this.client.get("/repos/" + this.name + "/statuses/" + ref, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo statuses error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.combinedStatus = function(ref, cb) {
      return this.client.get("/repos/" + this.name + "/commits/" + ref + "/status", function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo statuses error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.status = function(sha, obj, cb) {
      return this.client.post("/repos/" + this.name + "/statuses/" + sha, obj, function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 201) {
          return cb(new Error("Repo status error"));
        } else {
          return cb(null, b, h);
        }
      });
    };

    Repo.prototype.stargazers = function() {
      var cb, i, params, ref1;
      params = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      return (ref1 = this.client).get.apply(ref1, ["/repos/" + this.name + "/stargazers"].concat(slice.call(params), [function(err, s, b, h) {
        if (err) {
          return cb(err);
        }
        if (s !== 200) {
          return cb(new Error("Repo stargazers error"));
        } else {
          return cb(null, b, h);
        }
      }]));
    };

    return Repo;

  })(Base);

  module.exports = Repo;

}).call(this);
