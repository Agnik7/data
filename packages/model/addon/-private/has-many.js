/**
  @module @ember-data/model
*/
import { computed } from '@ember/object';
import { assert, inspect } from '@ember/debug';
import { normalizeModelName } from '@ember-data/store';
import { DEBUG } from '@glimmer/env';

/**
  `hasMany` is used to define One-To-Many and Many-To-Many
  relationships on a [Model](/api/data/classes/DS.Model.html).

  `hasMany` takes an optional hash as a second parameter, currently
  supported options are:

  - `async`: A boolean value used to explicitly declare this to be an async relationship. The default is true.
  - `inverse`: A string used to identify the inverse property on a related model.

  #### One-To-Many
  To declare a one-to-many relationship between two models, use
  `belongsTo` in combination with `hasMany`, like this:

  ```app/models/post.js
  import Model, { hasMany } from '@ember-data/model';

  export default Model.extend({
    comments: hasMany('comment')
  });
  ```

  ```app/models/comment.js
  import Model, { belongsTo } from '@ember-data/model';

  export default Model.extend({
    post: belongsTo('post')
  });
  ```

  #### Many-To-Many
  To declare a many-to-many relationship between two models, use
  `hasMany`:

  ```app/models/post.js
  import Model, { hasMany } from '@ember-data/model';

  export default Model.extend({
    tags: hasMany('tag')
  });
  ```

  ```app/models/tag.js
  import Model, { hasMany } from '@ember-data/model';

  export default Model.extend({
    posts: hasMany('post')
  });
  ```

  You can avoid passing a string as the first parameter. In that case Ember Data
  will infer the type from the singularized key name.

  ```app/models/post.js
  import Model, { hasMany } from '@ember-data/model';

  export default Model.extend({
    tags: hasMany()
  });
  ```

  will lookup for a Tag type.

  #### Explicit Inverses

  Ember Data will do its best to discover which relationships map to
  one another. In the one-to-many code above, for example, Ember Data
  can figure out that changing the `comments` relationship should update
  the `post` relationship on the inverse because post is the only
  relationship to that model.

  However, sometimes you may have multiple `belongsTo`/`hasMany` for the
  same type. You can specify which property on the related model is
  the inverse using `hasMany`'s `inverse` option:

  ```app/models/comment.js
  import Model, { belongsTo } from '@ember-data/model';

  export default Model.extend({
    onePost: belongsTo('post'),
    twoPost: belongsTo('post'),
    redPost: belongsTo('post'),
    bluePost: belongsTo('post')
  });
  ```

  ```app/models/post.js
  import Model, { hasMany } from '@ember-data/model';

  export default Model.extend({
    comments: hasMany('comment', {
      inverse: 'redPost'
    })
  });
  ```

  You can also specify an inverse on a `belongsTo`, which works how
  you'd expect.

  #### Sync relationships

  Ember Data resolves sync relationships with the related resources
  available in its local store, hence it is expected these resources
  to be loaded before or along-side the primary resource.

  ```app/models/post.js
  import Model, { hasMany } from '@ember-data/model';

  export default Model.extend({
    comments: hasMany('comment', {
      async: false
    })
  });
  ```

  In contrast to async relationship, accessing a sync relationship
  will always return a [ManyArray](/api/data/classes/DS.ManyArray.html) instance
  containing the existing local resources. But it will error on access
  when any of the known related resources have not been loaded.

  ```
  post.get('comments').forEach((comment) => {

  });

  ```

  If you are using `links` with sync relationships, you have to use
  `ref.reload` to fetch the resources.

  @method hasMany
  @param {String} type (optional) type of the relationship
  @param {Object} options (optional) a hash of options
  @return {Ember.computed} relationship
*/
export default function hasMany(type, options) {
  if (typeof type === 'object') {
    options = type;
    type = undefined;
  }

  assert(
    `The first argument to hasMany must be a string representing a model type key, not an instance of ${inspect(
      type
    )}. E.g., to define a relation to the Comment model, use hasMany('comment')`,
    typeof type === 'string' || typeof type === 'undefined'
  );

  options = options || {};

  if (typeof type === 'string') {
    type = normalizeModelName(type);
  }

  // Metadata about relationships is stored on the meta of
  // the relationship. This is used for introspection and
  // serialization. Note that `key` is populated lazily
  // the first time the CP is called.
  let meta = {
    type,
    options,
    isRelationship: true,
    kind: 'hasMany',
    name: 'Has Many',
    key: null,
  };

  return computed({
    get(key) {
      if (DEBUG) {
        if (['_internalModel', 'recordData', 'currentState'].indexOf(key) !== -1) {
          throw new Error(
            `'${key}' is a reserved property name on instances of classes extending Model. Please choose a different property name for your hasMany on ${this.constructor.toString()}`
          );
        }
      }
      return this._internalModel.getHasMany(key);
    },
    set(key, records) {
      if (DEBUG) {
        if (['_internalModel', 'recordData', 'currentState'].indexOf(key) !== -1) {
          throw new Error(
            `'${key}' is a reserved property name on instances of classes extending Model. Please choose a different property name for your hasMany on ${this.constructor.toString()}`
          );
        }
      }
      let internalModel = this._internalModel;
      internalModel.setDirtyHasMany(key, records);

      return internalModel.getHasMany(key);
    },
  }).meta(meta);
}